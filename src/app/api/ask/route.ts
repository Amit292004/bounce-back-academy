import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { logger } from '@/lib/logger'

// Groq client is instantiated inside the handler to prevent build-time crashes if API key is missing


const DIFFICULTY_PROMPTS: Record<string, string> = {
  basic: 'Use very simple language (Class 8-9 level). Avoid complex terminology. Give very short, easy-to-understand answers with relatable real-life examples.',
  standard: 'Use clear, structured explanations suitable for Class 10-12 students. Balance depth and simplicity.',
  advanced: 'Give in-depth, exam-focused explanations with derivations, edge cases, and exam tips. Suitable for competitive exam preparation (JEE/NEET advanced level).',
};

const SYSTEM_PROMPT = (difficulty: string, language: string) => {
  const langInstr =
    language === 'hindi'
      ? 'Respond entirely in Hindi (Devanagari script).'
      : language === 'hinglish'
      ? 'Respond in Hinglish — a friendly mix of Hindi and English. Use Hindi for explanations and conversions, and English for technical/academic terms.'
      : 'Respond in clear, simple English.';

  return `You are Bounce Back AI, India's friendliest and smartest AI tutor for students from Class 6-12, JEE, NEET, board exams and college.
Adopt a friendly, expert, and exam-oriented teaching style.

Language mode: ${langInstr}
Difficulty level: ${DIFFICULTY_PROMPTS[difficulty] ?? DIFFICULTY_PROMPTS.standard}

Always follow this exact response structure:
## 📚 Topic
(One-line topic identification)

## 💡 Concept
(Simple explanation — break complex ideas into small parts, use real-life analogies)

## 🔢 Step-by-Step Solution
(For numericals: show Formula → Why this formula → Solve step by step)
(For theory: use bullet points with examples)
(For coding: explain logic first, then code with line-by-line comments)

## ✅ Final Answer
(Highlight the answer clearly)

## 🧠 Quick Revision Tip
(Mnemonic, shortcut, or exam trick to remember this topic)

Rules:
- Teach like a brilliant, friendly teacher — not a robot
- Use **bold** for important terms, key equations, and final answers
- Use emojis sparingly to keep it engaging and friendly
- Never skip calculation steps for numericals
- If uncertain, say so clearly — never fabricate facts
- Be extremely encouraging and motivational to boost the student's confidence`;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logger.error('[/api/ask] GROQ_API_KEY is missing');
      return NextResponse.json({ error: 'AI service configuration error: API key missing' }, { status: 500 });
    }
    console.log(`[/api/ask] GROQ_API_KEY detected (len: ${apiKey.length})`);
    const groq = new Groq({ apiKey });

    const body = await request.json();
    const { question, subject, examType, difficulty = 'standard', language = 'english', chatHistory } = body;
    console.log(`[/api/ask] New question: "${question?.slice(0, 50)}..." [Lang: ${language}]`);

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT(difficulty, language) },
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
    logger.error('[/api/ask] FULL ERROR:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ 
      error: `AI service error: ${message}`,
      details: process.env.NODE_ENV === 'development' ? String(err) : undefined 
    }, { status: 500 });
  }
}
