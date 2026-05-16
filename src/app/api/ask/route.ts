import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Groq client is instantiated inside the handler to prevent build-time crashes if API key is missing


const DIFFICULTY_PROMPTS: Record<string, string> = {
  basic: 'Use very simple language (Class 8-9 level). Avoid complex terminology. Give very short, easy-to-understand answers with relatable real-life examples.',
  standard: 'Use clear, structured explanations suitable for Class 10-12 students. Balance depth and simplicity.',
  advanced: 'Give in-depth, exam-focused explanations with derivations, edge cases, and exam tips. Suitable for competitive exam preparation (JEE/NEET advanced level).',
};

const SYSTEM_PROMPT = (difficulty: string) => `You are an expert academic tutor for Indian students specializing in:
- General questions on any topic (science, math, history, current affairs, etc.)
- NBSE (Nagaland Board of Secondary Education) — Classes 8 to 12
- JEE (Joint Entrance Examination) — Physics, Chemistry, Mathematics
- NEET (National Eligibility cum Entrance Test) — Biology, Physics, Chemistry
- CUET (Common University Entrance Test) — All subjects

Difficulty level: ${DIFFICULTY_PROMPTS[difficulty] ?? DIFFICULTY_PROMPTS.standard}

Formatting rules (STRICTLY follow these):
1. Use **bold** for key terms, formulas, and important points
2. Use numbered lists (1. 2. 3.) for steps
3. Use bullet points (- item) for lists
4. For formulas write them clearly: e.g. F = ma, v² = u² + 2as
5. Use ### for section headings when needed
6. End every answer with a "💡 Quick Tip:" line highlighting the most common mistake or exam trick
7. Keep answers focused — not too long, not too short
8. Be encouraging — students may be struggling`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('[/api/ask] GROQ_API_KEY is missing');
      return NextResponse.json({ error: 'AI service configuration error: API key missing' }, { status: 500 });
    }
    const groq = new Groq({ apiKey });

    const body = await request.json();
    const { question, subject, examType, difficulty = 'standard', chatHistory } = body;
    console.log(`[/api/ask] New question: "${question?.slice(0, 50)}..."`);

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT(difficulty) },
    ];

    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      const recent = chatHistory.slice(-6);
      for (const msg of recent) {
        messages.push({ role: msg.role, content: String(msg.content).slice(0, 2000) });
      }
    }

    const contextPrefix = [
      examType ? `[Exam: ${examType}]` : '',
      subject ? `[Subject: ${subject}]` : '',
    ].filter(Boolean).join(' ');

    const fullText = contextPrefix ? `${contextPrefix}\n\n${question}` : question;
    messages.push({ role: 'user', content: fullText });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1500,
      temperature: 0.65,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content ?? '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          console.log(`[/api/ask] Stream finished for: "${question?.slice(0, 20)}..."`);
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: unknown) {
    console.error('[/api/ask] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `AI service error: ${message}` }, { status: 500 });
  }
}
