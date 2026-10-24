import test from 'node:test';
import assert from 'node:assert/strict';

test('AI Tutor & Doubt Solver Configuration Suite', async (t) => {
  const DIFFICULTY_PROMPTS = {
    basic: 'Use very simple language (Class 8-9 level). Avoid complex terminology. Give very short, easy-to-understand answers with relatable real-life examples.',
    standard: 'Use clear, structured explanations suitable for Class 10-12 students. Balance depth and simplicity.',
    advanced: 'Give in-depth, exam-focused explanations with derivations, edge cases, and exam tips. Suitable for competitive exam preparation (JEE/NEET advanced level).',
  };

  const buildSystemPrompt = (difficulty, language) => {
    const langInstr =
      language === 'hindi'
        ? 'Respond entirely in Hindi (Devanagari script).'
        : language === 'hinglish'
        ? 'Respond in Hinglish — a friendly mix of Hindi and English. Use Hindi for explanations and conversions, and English for technical/academic terms.'
        : 'Respond in clear, simple English.';

    return `You are Bounce Back AI, an advanced, highly knowledgeable academic AI tutor specializing in Classes 8-12 (CBSE, NBSE, ICSE), JEE Main/Advanced, NEET, CUET, and undergraduate STEM subjects.
Language mode: ${langInstr}
Difficulty level: ${DIFFICULTY_PROMPTS[difficulty] ?? DIFFICULTY_PROMPTS.standard}`;
  };

  await t.test('builds standard English prompt correctly', () => {
    const prompt = buildSystemPrompt('standard', 'english');
    assert.match(prompt, /clear, simple English/);
    assert.match(prompt, /suitable for Class 10-12/);
  });

  await t.test('builds basic Hindi prompt correctly', () => {
    const prompt = buildSystemPrompt('basic', 'hindi');
    assert.match(prompt, /Devanagari script/);
    assert.match(prompt, /Class 8-9 level/);
  });

  await t.test('builds advanced Hinglish prompt correctly for JEE/NEET', () => {
    const prompt = buildSystemPrompt('advanced', 'hinglish');
    assert.match(prompt, /Respond in Hinglish/);
    assert.match(prompt, /JEE\/NEET advanced level/);
  });

  await t.test('falls back gracefully to standard on unknown difficulty', () => {
    const prompt = buildSystemPrompt('olympiad-expert', 'english');
    assert.match(prompt, /suitable for Class 10-12/);
  });
});
