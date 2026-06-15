"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FaTrash, FaPlus, FaChevronLeft, FaImage, FaFileAlt, FaKeyboard, FaListOl } from 'react-icons/fa';
import { logger } from '@/lib/logger'

interface Question {
  id: string;
  questionText?: string | null;
  imageUrl?: string | null;
  type: string; // "MCQ" or "TEXT"
  options?: string | null;
  answer: string;
  explanation?: string | null;
  timeLimit?: number | null;
  createdAt: string;
}

interface Quiz {
  id: string;
  title: string;
  className: string;
  subject?: {
    name: string;
  } | null;
  questions: Question[];
}

export default function QuizQuestionsManagerPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [qType, setQType] = useState<'MCQ' | 'TEXT'>('MCQ');
  const [qText, setQText] = useState('');
  const [qImage, setQImage] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  
  // MCQ specific options
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [mcqAnswerIdx, setMcqAnswerIdx] = useState('0'); // '0' = Option A, '1' = Option B...

  // Text input specific correct answer
  const [textCorrectAnswer, setTextCorrectAnswer] = useState('');

  // Question specific time limit in seconds
  const [qTimeLimit, setQTimeLimit] = useState('30');

  useEffect(() => {
    fetchQuizDetails();
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`);
      if (res.ok) {
        setQuiz(await res.json());
      } else {
        router.push('/admin/dashboard/quizzes');
      }
    } catch (err) {
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!qText.trim() && !qImage.trim()) {
      alert('Please provide either Question Text or a Question Image.');
      return;
    }

    let finalAnswer = '';
    let finalOptionsArray: string[] = [];

    if (qType === 'MCQ') {
      if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
        alert('Please fill out all four MCQ options (Option A, B, C, and D).');
        return;
      }
      finalOptionsArray = [optA.trim(), optB.trim(), optC.trim(), optD.trim()];
      finalAnswer = mcqAnswerIdx; // Index (0, 1, 2, or 3)
    } else {
      if (!textCorrectAnswer.trim()) {
        alert('Please specify the correct answer text.');
        return;
      }
      finalAnswer = textCorrectAnswer.trim();
    }

    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: qText.trim() || null,
          imageUrl: qImage.trim() || null,
          type: qType,
          options: qType === 'MCQ' ? finalOptionsArray : null,
          answer: finalAnswer,
          explanation: qExplanation.trim() || null,
          timeLimit: parseInt(qTimeLimit) || 30
        })
      });

      if (res.ok) {
        // Clear Form states
        setQText('');
        setQImage('');
        setQExplanation('');
        setOptA('');
        setOptB('');
        setOptC('');
        setOptD('');
        setMcqAnswerIdx('0');
        setTextCorrectAnswer('');
        setQTimeLimit('30');
        
        // Reload details
        fetchQuizDetails();
      }
    } catch (err) {
      logger.error('Failed to create question:', err);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/questions/${qId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setQuiz(prev => prev ? {
          ...prev,
          questions: prev.questions.filter(q => q.id !== qId)
        } : null);
      }
    } catch (err) {
      logger.error('Failed to delete question:', err);
    }
  };

  if (loading) return <div>Loading question details...</div>;
  if (!quiz) return <div>Quiz not found.</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/admin/dashboard/quizzes"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}
        >
          <FaChevronLeft /> Back to Quizzes
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{quiz.title}</h1>
        <p style={{ opacity: 0.7, fontSize: '0.95rem' }}>
          Class {quiz.className} • {quiz.subject?.name || 'General Subject'} • {quiz.questions.length} questions loaded
        </p>
      </div>

      {/* Add New Question Form */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaPlus /> Add New Question
        </h2>
        <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            {/* 1. Question Type Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Question Format</label>
              <select
                value={qType}
                onChange={(e: any) => setQType(e.target.value)}
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                }}
              >
                <option value="MCQ">Multiple Choice Question (MCQ)</option>
                <option value="TEXT">Text Input / Exact-Word Match</option>
              </select>
            </div>

            {/* 2. Custom Time Limit (seconds) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Time Limit (seconds)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={qTimeLimit}
                onChange={(e) => setQTimeLimit(e.target.value)}
                placeholder="30"
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                }}
                required
              />
            </div>
            
            {/* 3. Optional Image URL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Question Image URL (Optional)</label>
              <input
                type="text"
                value={qImage}
                onChange={(e) => setQImage(e.target.value)}
                placeholder="e.g. https://example.com/maths-equation.png"
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                }}
              />
            </div>
          </div>

          {/* 3. Question text stem */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Question Text</label>
            <textarea
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="e.g. In which device is electrical current measured?"
              rows={3}
              style={{
                padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)',
                resize: 'vertical'
              }}
            />
          </div>

          {/* 4. MCQ Options Input Grid */}
          {qType === 'MCQ' && (
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--surface-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaListOl /> MCQ Option Choices:
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.6 }}>Option A</label>
                  <input
                    type="text"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    placeholder="e.g. Ammeter"
                    style={{
                      padding: '0.65rem', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                    }}
                    required={qType === 'MCQ'}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.6 }}>Option B</label>
                  <input
                    type="text"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    placeholder="e.g. Voltmeter"
                    style={{
                      padding: '0.65rem', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                    }}
                    required={qType === 'MCQ'}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.6 }}>Option C</label>
                  <input
                    type="text"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    placeholder="e.g. Ohm-meter"
                    style={{
                      padding: '0.65rem', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                    }}
                    required={qType === 'MCQ'}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.6 }}>Option D</label>
                  <input
                    type="text"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    placeholder="e.g. Galvanometer"
                    style={{
                      padding: '0.65rem', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                    }}
                    required={qType === 'MCQ'}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '280px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Designate Correct Option Choice</label>
                <select
                  value={mcqAnswerIdx}
                  onChange={(e) => setMcqAnswerIdx(e.target.value)}
                  style={{
                    padding: '0.65rem', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)',
                    fontWeight: 700
                  }}
                >
                  <option value="0">Option A</option>
                  <option value="1">Option B</option>
                  <option value="2">Option C</option>
                  <option value="3">Option D</option>
                </select>
              </div>
            </div>
          )}

          {/* 5. TEXT Option Correct Answer Input */}
          {qType === 'TEXT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaKeyboard /> Correct Answer (exact matching text)
              </label>
              <input
                type="text"
                value={textCorrectAnswer}
                onChange={(e) => setTextCorrectAnswer(e.target.value)}
                placeholder="e.g. Ammeter"
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                }}
                required={qType === 'TEXT'}
              />
            </div>
          )}

          {/* 6. Short Explanation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Short Explanation</label>
            <textarea
              value={qExplanation}
              onChange={(e) => setQExplanation(e.target.value)}
              placeholder="Provide a quick step-by-step resolution so students learn from their mistakes..."
              rows={3}
              style={{
                padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)',
                resize: 'vertical'
              }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-end' }}>
            <FaPlus /> Save Question
          </button>
        </form>
      </div>

      {/* Questions list */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>Quiz Questions</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {quiz.questions.map((question, index) => {
          const isMCQ = question.type === 'MCQ';
          const optionsList = question.options ? question.options.split('|') : [];
          const correctIdx = parseInt(question.answer);

          return (
            <div key={question.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                {index + 1}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: isMCQ ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)', color: isMCQ ? 'var(--primary)' : '#f59e0b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {isMCQ ? 'Multiple Choice (MCQ)' : 'Text Input'}
                  </span>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(99,102,241,0.06)', color: 'var(--primary)', border: '1px solid var(--surface-border)', fontSize: '0.75rem', fontWeight: 700 }}>
                    ⏱️ {question.timeLimit || 30}s
                  </span>
                </div>

                {question.questionText && (
                  <p style={{ fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>{question.questionText}</p>
                )}
                
                {question.imageUrl && (
                  <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '0.5rem', display: 'inline-flex', maxWidth: '300px' }}>
                    <img src={question.imageUrl} alt={`Question ${index + 1}`} style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px' }} />
                  </div>
                )}

                {/* MCQ option choices preview */}
                {isMCQ && optionsList.length === 4 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', maxWidth: '500px' }}>
                    {optionsList.map((opt, oIdx) => {
                      const isCorrectChoice = oIdx === correctIdx;
                      return (
                        <div
                          key={oIdx}
                          style={{
                            padding: '0.65rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: isCorrectChoice ? '#10b981' : 'var(--surface-border)',
                            background: isCorrectChoice ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                            color: isCorrectChoice ? '#10b981' : 'var(--foreground)',
                            fontWeight: isCorrectChoice ? 700 : 500,
                            fontSize: '0.9rem',
                            display: 'flex',
                            gap: '0.5rem'
                          }}
                        >
                          <span style={{ opacity: 0.6 }}>{String.fromCharCode(65 + oIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--surface-highlight)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  {!isMCQ && (
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Correct Answer</span>
                      <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>{question.answer}</span>
                    </div>
                  )}
                  {question.explanation && (
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Explanation</span>
                      <span style={{ opacity: 0.9, fontSize: '0.9rem', lineHeight: 1.4 }}>{question.explanation}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDeleteQuestion(question.id)}
                style={{
                  position: 'absolute', top: '1.5rem', right: '1.5rem',
                  background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer'
                }}
              >
                <FaTrash size={18} />
              </button>
            </div>
          );
        })}

        {quiz.questions.length === 0 && (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
            No questions added to this quiz yet. Use the form above to add your first question!
          </div>
        )}
      </div>
    </div>
  );
}
