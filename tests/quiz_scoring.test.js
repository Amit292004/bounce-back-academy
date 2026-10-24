const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Evaluation helper matching QuizClient evaluation logic
function evaluateAnswer(userAnswer, question) {
  if (!userAnswer || !question) return false;

  const normalizedUser = String(userAnswer).trim().toLowerCase();
  const normalizedCorrect = String(question.answer).trim().toLowerCase();

  if (question.type === 'MCQ') {
    // Matches either the index (0, 1, 2...) or the exact option text
    if (normalizedUser === normalizedCorrect) return true;
    if (question.options) {
      const options = question.options.split('|').map((o) => o.trim().toLowerCase());
      const correctIndex = parseInt(question.answer, 10);
      if (!isNaN(correctIndex) && options[correctIndex] === normalizedUser) {
        return true;
      }
    }
    return false;
  }

  // TEXT type: trim and whitespace normalization
  return (
    normalizedUser === normalizedCorrect ||
    normalizedUser.replace(/\s+/g, '') === normalizedCorrect.replace(/\s+/g, '')
  );
}

function calculateScore(questions, answers, negativeMarkingPerQuestion = 0) {
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  for (const q of questions) {
    const ans = answers[q.id];
    if (ans === undefined || ans === null || String(ans).trim() === '') {
      unattemptedCount++;
      continue;
    }

    if (evaluateAnswer(ans, q)) {
      score += 1;
      correctCount++;
    } else {
      score -= negativeMarkingPerQuestion;
      incorrectCount++;
    }
  }

  return {
    score: Math.max(0, score),
    correctCount,
    incorrectCount,
    unattemptedCount,
    totalQuestions: questions.length,
    percentage: Math.round((correctCount / questions.length) * 100),
  };
}

describe('Assessment & Quiz Scoring Logic Suite', () => {
  const sampleQuestions = [
    {
      id: 'q1',
      type: 'MCQ',
      options: 'Ammeter | Voltmeter | Galvanometer | Ohmmeter',
      answer: '0',
    },
    {
      id: 'q2',
      type: 'TEXT',
      answer: '4/5',
    },
    {
      id: 'q3',
      type: 'TEXT',
      answer: 'Fe2O3',
    },
  ];

  test('correctly evaluates accurate MCQ and TEXT submissions', () => {
    const userAnswers = {
      q1: '0',
      q2: '4/5',
      q3: 'Fe2O3',
    };

    const result = calculateScore(sampleQuestions, userAnswers);
    assert.equal(result.correctCount, 3);
    assert.equal(result.incorrectCount, 0);
    assert.equal(result.score, 3);
    assert.equal(result.percentage, 100);
  });

  test('correctly handles MCQ matching by text instead of index', () => {
    const userAnswers = {
      q1: 'ammeter',
      q2: '4/5',
      q3: 'Fe2O3',
    };

    const result = calculateScore(sampleQuestions, userAnswers);
    assert.equal(result.correctCount, 3);
  });

  test('correctly tallies unattempted questions without penalizing', () => {
    const userAnswers = {
      q1: '0',
      // q2 unattempted
      // q3 unattempted
    };

    const result = calculateScore(sampleQuestions, userAnswers);
    assert.equal(result.correctCount, 1);
    assert.equal(result.unattemptedCount, 2);
    assert.equal(result.score, 1);
  });

  test('correctly applies negative marking when configured', () => {
    const userAnswers = {
      q1: '0', // correct (+1)
      q2: '1/2', // incorrect (-0.25)
      q3: 'NaCl', // incorrect (-0.25)
    };

    const result = calculateScore(sampleQuestions, userAnswers, 0.25);
    assert.equal(result.correctCount, 1);
    assert.equal(result.incorrectCount, 2);
    assert.equal(result.score, 0.5);
  });
});
