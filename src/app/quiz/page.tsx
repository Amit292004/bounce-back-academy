"use client";

import { useState, useEffect, useRef } from 'react';
import { FaGraduationCap, FaHourglassHalf, FaPlay, FaCheckCircle, FaTimesCircle, FaTrophy, FaArrowRight, FaRedo, FaRegFileAlt, FaKeyboard, FaEye, FaArrowLeft, FaListOl } from 'react-icons/fa';
import styles from './page.module.css';
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
}

interface Quiz {
  id: string;
  title: string;
  className: string;
  subject?: {
    name: string;
  } | null;
  questions: Question[];
  createdAt: string;
}

// Pre-seeded fallback quizzes in case the database is empty
const STATIC_FALLBACK_QUIZZES: Quiz[] = [
  {
    id: 'static-maths-10',
    title: '📐 Trigonometry & Algebra Essentials',
    className: '10',
    subject: { name: 'Maths' },
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-m-1',
        questionText: 'In a right-angled triangle, if sin θ = 3/5, what is the value of cos θ? (Express in fractional form like a/b)',
        type: 'TEXT',
        answer: '4/5',
        explanation: 'By the Pythagorean identity, sin² θ + cos² θ = 1. Therefore, cos θ = sqrt(1 - (3/5)²) = sqrt(16/25) = 4/5.'
      },
      {
        id: 'q-m-2',
        questionText: 'What is the discriminant of the quadratic equation 2x² - 4x + 3 = 0?',
        type: 'MCQ',
        options: '-8 | 8 | -4 | 16',
        answer: '0',
        explanation: 'The discriminant formula is D = b² - 4ac. Here, D = (-4)² - 4(2)(3) = 16 - 24 = -8. The correct choice is Option A (-8).'
      }
    ]
  },
  {
    id: 'static-science-10',
    title: '⚡ Electricity & Chemical Elements',
    className: '10',
    subject: { name: 'Science' },
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-s-1',
        questionText: 'Which device is used to measure electrical current in a circuit?',
        type: 'MCQ',
        options: 'Ammeter | Voltmeter | Ohm-meter | Galvanometer',
        answer: '0',
        explanation: 'An ammeter is connected in series in a circuit to measure the rate of flow of electric charge (current). Correct choice is Option A.'
      },
      {
        id: 'q-s-2',
        questionText: 'What is the chemical formula of common rust?',
        type: 'TEXT',
        answer: 'Fe2O3',
        explanation: 'Rust is hydrated iron(III) oxide, represented by the formula Fe2O3.'
      }
    ]
  }
];

export default function StudentQuizPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizState, setQuizState] = useState<'dashboard' | 'playing' | 'summary'>('dashboard');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Interactive Play states
  const [typedAnswer, setTypedAnswer] = useState('');
  const [selectedMcqOption, setSelectedMcqOption] = useState<number | null>(null);
  const [isAnswerValidated, setIsAnswerValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const [score, setScore] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question for text input
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setQuizzes(data);
        } else {
          setQuizzes(STATIC_FALLBACK_QUIZZES);
        }
      } else {
        setQuizzes(STATIC_FALLBACK_QUIZZES);
      }
    } catch (err) {
      logger.error('Failed to load quizzes:', err);
      setQuizzes(STATIC_FALLBACK_QUIZZES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizState === 'playing' && selectedQuiz && selectedQuiz.questions[currentQuestionIdx]) {
      const qDuration = selectedQuiz.questions[currentQuestionIdx].timeLimit || 30;
      setTimeLeft(qDuration);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizState, currentQuestionIdx, selectedQuiz]);

  const handleTimeOut = () => {
    setIsCorrect(false);
    setIsAnswerValidated(true);
    setWrongAnswersCount((prev) => prev + 1);
  };

  const startQuiz = (quiz: Quiz) => {
    if (!quiz.questions || quiz.questions.length === 0) {
      alert('This quiz has no questions yet. Please check back later!');
      return;
    }
    setSelectedQuiz(quiz);
    setCurrentQuestionIdx(0);
    setScore(0);
    setWrongAnswersCount(0);
    setTypedAnswer('');
    setSelectedMcqOption(null);
    setIsAnswerValidated(false);
    setIsCorrect(false);
    setQuizState('playing');
  };

  const validateAnswer = () => {
    if (isAnswerValidated) return;
    
    const question = selectedQuiz!.questions[currentQuestionIdx];
    const isMCQ = question.type === 'MCQ';

    if (isMCQ) {
      if (selectedMcqOption === null) return;
      
      // Stop the timer
      if (timerRef.current) clearInterval(timerRef.current);
      
      const correctIdx = parseInt(question.answer);
      const matches = selectedMcqOption === correctIdx;
      
      setIsCorrect(matches);
      setIsAnswerValidated(true);
      
      if (matches) {
        setScore((prev) => prev + 1);
      } else {
        setWrongAnswersCount((prev) => prev + 1);
      }
    } else {
      if (!typedAnswer.trim()) return;
      
      // Stop the timer
      if (timerRef.current) clearInterval(timerRef.current);
      
      const studentAns = typedAnswer.trim().toLowerCase();
      const correctAns = question.answer.trim().toLowerCase();
      
      const matches = studentAns === correctAns;
      setIsCorrect(matches);
      setIsAnswerValidated(true);
      
      if (matches) {
        setScore((prev) => prev + 1);
      } else {
        setWrongAnswersCount((prev) => prev + 1);
      }
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIdx + 1 < selectedQuiz!.questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setTypedAnswer('');
      setSelectedMcqOption(null);
      setIsAnswerValidated(false);
      setIsCorrect(false);
    } else {
      // Calculate XP
      const calculatedXp = score * 50;
      setEarnedXp(calculatedXp);
      
      setQuizState('summary');
    }
  };

  const restartQuiz = () => {
    startQuiz(selectedQuiz!);
  };

  const filteredQuizzes = quizzes.filter(q => {
    return selectedClassFilter === 'all' || q.className === selectedClassFilter;
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading dynamic quiz modules...</p>
      </div>
    );
  }

  const currentQuestion = selectedQuiz?.questions[currentQuestionIdx];
  const isMCQ = currentQuestion?.type === 'MCQ';
  const optionsList = (isMCQ && currentQuestion?.options) ? currentQuestion.options.split('|').map(o => o.trim()) : [];

  return (
    <div className={styles.container}>
      {/* 1. QUIZ DASHBOARD VIEW */}
      {quizState === 'dashboard' && (
        <div>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.badge}>
              <FaGraduationCap /> Academy Practice Arena
            </div>
            <h1 className={styles.title}>
              Practice <span className="text-gradient">Quizzes & Tests</span>
            </h1>
            <p className={styles.subtitle}>
              Practice class-by-class! Select multiple-choice choices or type in text answers exactly, check evaluations, and read detailed explanations.
            </p>
          </div>

          {/* Class Filters */}
          <div className={styles.filterChips} style={{ justifyContent: 'center', marginBottom: '2.5rem' }}>
            {['all', '9', '10', '11', '12'].map((c) => (
              <button
                key={c}
                className={`${styles.filterChip} ${selectedClassFilter === c ? styles.activeChip : ''}`}
                onClick={() => setSelectedClassFilter(c)}
              >
                {c === 'all' ? 'All Classes' : `Class ${c}`}
              </button>
            ))}
          </div>

          {/* Featured Cards Grid */}
          <div className={styles.quizGrid}>
            {filteredQuizzes.map((quiz) => (
              <div key={quiz.id} className={`glass-panel ${styles.quizCard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.classBadge}>Class {quiz.className}</span>
                  <span className={styles.subjectBadge}>{quiz.subject?.name || 'General'}</span>
                </div>
                <h3 className={styles.quizCardTitle}>{quiz.title}</h3>
                <div className={styles.quizMeta}>
                  <span>📝 {quiz.questions.length} Questions</span>
                  <span>⏱️ 30s / Question</span>
                </div>
                <button onClick={() => startQuiz(quiz)} className={styles.startBtn}>
                  <FaPlay /> Start Challenge
                </button>
              </div>
            ))}

            {filteredQuizzes.length === 0 && (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1', opacity: 0.6 }}>
                No active quizzes loaded for Class {selectedClassFilter} yet. Check back soon!
              </div>
            )}
          </div>

          {/* Full Mock Tests Section */}
          <div className={`glass-panel ${styles.mockSection}`}>
            <h2 className={styles.mockSectionTitle}>
              <FaRegFileAlt /> Term & Board Prep Mock Tests (Class 9-12)
            </h2>
            <p className={styles.mockDesc}>
              Complete full-length, subject-wise mock papers structured directly according to state board regulations. Features standard question formats and timed limits.
            </p>
            <div className={styles.mockLinksGrid}>
              <a href="/papers" className={styles.mockLinkCard}>
                <span>Maths Boards Mock 2026</span>
                <span className={styles.actionArrow}><FaArrowRight /></span>
              </a>
              <a href="/papers" className={styles.mockLinkCard}>
                <span>Science Term I Mock 2026</span>
                <span className={styles.actionArrow}><FaArrowRight /></span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. LIVE INTERACTIVE PLAY MODULE */}
      {quizState === 'playing' && selectedQuiz && currentQuestion && (
        <div className={styles.quizContainer}>
          <div className={styles.quizPanelHeader}>
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to exit? Progress will be lost.')) {
                  setQuizState('dashboard');
                }
              }} 
              className={styles.exitBtn}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FaArrowLeft /> Exit
            </button>
            <div className={styles.timerPill} style={{ borderColor: timeLeft <= 5 ? '#ff4040' : 'var(--surface-border)' }}>
              <FaHourglassHalf style={{ color: timeLeft <= 5 ? '#ff4040' : 'var(--primary)' }} />
              <span style={{ color: timeLeft <= 5 ? '#ff4040' : 'var(--foreground)' }}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressBox}>
            <div className={styles.progressText}>
              <span>Question {currentQuestionIdx + 1} of {selectedQuiz.questions.length}</span>
              <span>Score: {score}</span>
            </div>
            <div className={styles.progressBarWrapper}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${((currentQuestionIdx + 1) / selectedQuiz.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Dynamic Question Card */}
          <div className={`glass-panel ${styles.questionCard}`}>
            
            <div style={{ marginBottom: '1rem', display: 'flex' }}>
              <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: isMCQ ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)', color: isMCQ ? 'var(--primary)' : '#f59e0b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                {isMCQ ? 'Selectable MCQ' : 'Text Input Match'}
              </span>
            </div>

            {/* 1. Question Text */}
            {currentQuestion.questionText && (
              <h2 className={styles.questionText} style={{ marginBottom: currentQuestion.imageUrl ? '1.5rem' : '2.5rem' }}>
                {currentQuestion.questionText}
              </h2>
            )}

            {/* 2. Question Image Form */}
            {currentQuestion.imageUrl && (
              <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '0.75rem', display: 'flex', justifyContent: 'center', marginBottom: '2rem', border: '1px solid var(--surface-border)' }}>
                <img 
                  src={currentQuestion.imageUrl!} 
                  alt="Question Diagram" 
                  style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '8px' }} 
                />
              </div>
            )}

            {/* 3. Render playing inputs based on type */}
            {isMCQ ? (
              /* MCQ Choices Buttons Grid */
              <div className={styles.optionsGrid}>
                {optionsList.map((option, idx) => {
                  const isSelected = selectedMcqOption === idx;
                  const correctIdx = parseInt(currentQuestion.answer);
                  const isCorrectChoice = idx === correctIdx;
                  const isWrongChoice = isSelected && !isCorrectChoice;

                  let optionClass = styles.optionItem;
                  if (isSelected) optionClass += ` ${styles.optionSelected}`;
                  if (isAnswerValidated) {
                    if (isCorrectChoice) optionClass += ` ${styles.optionCorrect}`;
                    if (isWrongChoice) optionClass += ` ${styles.optionWrong}`;
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isAnswerValidated) return;
                        setSelectedMcqOption(idx);
                      }}
                      disabled={isAnswerValidated}
                      className={optionClass}
                    >
                      <span className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                      <span className={styles.optionContent}>{option}</span>
                      {isAnswerValidated && isCorrectChoice && <FaCheckCircle className={styles.correctIcon} />}
                      {isAnswerValidated && isWrongChoice && <FaTimesCircle className={styles.wrongIcon} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Text Input form */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaKeyboard /> Enter Your Answer:
                </label>
                
                <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                  <input
                    type="text"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    disabled={isAnswerValidated}
                    placeholder={isAnswerValidated ? '' : "Type your answer here..."}
                    style={{
                      flex: 1,
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      border: '1.5px solid var(--surface-border)',
                      background: 'var(--surface-highlight)',
                      color: 'var(--foreground)',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    className={
                      isAnswerValidated 
                        ? isCorrect 
                          ? styles.inputCorrect 
                          : styles.inputWrong 
                        : ''
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && typedAnswer.trim() && !isAnswerValidated) {
                        validateAnswer();
                      }
                    }}
                  />
                  
                  {isAnswerValidated && (
                    <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isCorrect ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.9rem' }}>
                          <FaCheckCircle /> Correct
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.9rem' }}>
                          <FaTimesCircle /> Incorrect
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Wrong Answer Recap for Text Inputs */}
            {isAnswerValidated && !isCorrect && !isMCQ && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '1rem 1.25rem', borderRadius: '10px', marginTop: '1.25rem', color: '#ef4444', fontWeight: 600 }}>
                ❌ Correct Answer was: <span style={{ textDecoration: 'underline', color: 'var(--foreground)', marginLeft: '0.25rem' }}>{currentQuestion.answer}</span>
              </div>
            )}

            {/* 5. Short Explanation Slide-in Box */}
            {isAnswerValidated && currentQuestion.explanation && (
              <div className={styles.explanationBox} style={{ marginTop: '2rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaEye /> Explanation
                </h4>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className={styles.actionRow}>
            {isAnswerValidated ? (
              <button onClick={nextQuestion} className={styles.actionBtn}>
                {currentQuestionIdx + 1 === selectedQuiz.questions.length ? 'Show Results' : 'Next Question'} <FaArrowRight />
              </button>
            ) : (
              <button 
                onClick={validateAnswer} 
                disabled={isMCQ ? selectedMcqOption === null : !typedAnswer.trim()} 
                className={`${styles.actionBtn} ${(isMCQ ? selectedMcqOption === null : !typedAnswer.trim()) ? styles.actionDisabled : ''}`}
              >
                Submit Answer
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. SCORE SUMMARY / WIN SHEET */}
      {quizState === 'summary' && selectedQuiz && (
        <div className={`glass-panel ${styles.summaryCard}`}>
          <div className={styles.trophyWrapper}>
            <FaTrophy className={styles.trophyIcon} />
          </div>
          <h1 className={styles.summaryTitle}>Quiz Completed!</h1>
          <p className={styles.summarySubtitle}>Excellent attempt in {selectedQuiz.title}!</p>

          <div className={styles.summaryStatsGrid}>
            <div className={styles.summaryStatItem}>
              <span className={styles.sumLabel}>Correct</span>
              <span className={styles.sumValue} style={{ color: '#10b981' }}>{score}</span>
            </div>
            <div className={styles.summaryStatItem}>
              <span className={styles.sumLabel}>Wrong</span>
              <span className={styles.sumValue} style={{ color: '#ef4444' }}>{wrongAnswersCount}</span>
            </div>
            <div className={styles.summaryStatItem}>
              <span className={styles.sumLabel}>Accuracy</span>
              <span className={styles.sumValue} style={{ color: 'var(--primary)' }}>
                {Math.round((score / selectedQuiz.questions.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Award message */}
          <div className={styles.xpAwardCard}>
            <h3>🎉 You Earned</h3>
            <div className={styles.xpText}>{earnedXp} XP Points</div>
            <p>Calculated and updated to your profile rankings!</p>
          </div>

          <div className={styles.summaryActions}>
            <button onClick={restartQuiz} className={styles.restartBtn}>
              <FaRedo /> Try Again
            </button>
            <button onClick={() => setQuizState('dashboard')} className={styles.dashboardBtn}>
              Return to Arena
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
