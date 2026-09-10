import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Groq from 'groq-sdk';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimit';
import { verifyToken } from '@/lib/auth';

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

  return `You are Bounce Back AI, an advanced, highly knowledgeable academic AI tutor specializing in Classes 8-12 (CBSE, NBSE, ICSE), JEE Main/Advanced, NEET, CUET, and undergraduate STEM subjects.
Adopt an authoritative, precise, structured, and academic teaching approach.

Language mode: ${langInstr}
Difficulty level: ${DIFFICULTY_PROMPTS[difficulty] ?? DIFFICULTY_PROMPTS.standard}

Always format your response using these exact markdown section headers:
## Topic
[Provide a clear, single-line topic and subject classification]

## Concept
[Concise, rigorous conceptual explanation breaking down core principles and physical/mathematical intuition]

## Step-by-Step Solution
[For numerical problems: state known parameters, state formulas with definitions, show step-by-step substitution and arithmetic clearly]
[For theoretical questions: clear, structured logical breakdown with concise bullet points]
[For coding problems: clear algorithmic logic followed by clean code with concise inline comments]

## Final Answer
[Clear, unambiguous final answer, with units and bold highlighting]

## Key Takeaway
[Crucial exam point, key formula, common mistake to avoid, or exam shortcut]

Formatting Rules:
- STRICT: Do NOT use emojis anywhere in your response. Maintain a strictly academic, professional, and clean tone.
- Use **bold** for key terms, governing laws, and final results.
- Write mathematical equations clearly using standard mathematical notation.
- Never skip intermediate calculation steps.
- If data is insufficient or ambiguous, clearly state assumptions.`;
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logger.error('[/api/ask] GROQ_API_KEY is missing');
      return NextResponse.json({ error: 'AI service configuration error: API key missing' }, { status: 500 });
    }
    const groq = new Groq({ apiKey });

    // 1. Check Rate Limit (20 requests per minute)
    const rateLimitResponse = await checkRateLimit(request, 20, 60);
    if (rateLimitResponse) return rateLimitResponse;

    // 2. Authentication & Trial Access
    const cookieStore = await cookies();
    const studentToken = cookieStore.get('student_token')?.value;
    const adminToken = cookieStore.get('admin_token')?.value;

    let isAuthed = false;
    if (studentToken) {
      const payload = await verifyToken(studentToken);
      if (payload?.userId) isAuthed = true;
    }
    if (!isAuthed && adminToken) {
      const payload = await verifyToken(adminToken);
      if (payload?.adminId) isAuthed = true;
    }

    const body = await request.json();
    const { question, subject, examType, difficulty = 'standard', language = 'english', chatHistory } = body;
    console.log(`[/api/ask] New question: "${question?.slice(0, 50)}..." [Lang: ${language}, Authed: ${isAuthed}]`);

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
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

    const PRIMARY_MODELS = ['qwen/qwen3.8-27b', 'qwen/qwen3.6-27b'];
    let completion;
    let lastError: unknown = null;

    for (const modelName of PRIMARY_MODELS) {
      try {
        completion = await groq.chat.completions.create({
          model: modelName,
          messages,
          max_tokens: 800,
          temperature: 0.65,
          stream: true,
        });
        break;
      } catch (err) {
        lastError = err;
        logger.warn(`[/api/ask] Model ${modelName} failed, trying next candidate:`, err);
      }
    }

    if (!completion) {
      throw lastError || new Error('All AI models are currently unavailable.');
    }

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
