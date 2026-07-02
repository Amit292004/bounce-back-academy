'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaPaperPlane, FaRobot, FaUser, FaTrash, FaLightbulb,
  FaStop, FaCopy, FaCheck, FaRedo, FaHistory, FaBookmark,
  FaMicrophone, FaTimes, FaChevronDown, FaGraduationCap,
  FaBrain, FaAtom, FaFlask, FaCalculator, FaBook
} from 'react-icons/fa';
import styles from './ask.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
}

const SparkleIcon = ({ size = 20, className }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M12 2c0 5.523 4.477 10 10 10-5.523 0-10 4.477-10 10 0-5.523-4.477-10-10-10 5.523 0 10-4.477 10-10z" />
  </svg>
);

const EXAM_TYPES = ['General', 'NBSE', 'JEE', 'NEET', 'CUET'];
const DIFFICULTY_LEVELS = [
  { id: 'basic',    label: 'Basic',    color: '#10b981', desc: 'Simple explanations' },
  { id: 'standard', label: 'Standard', color: '#6366f1', desc: 'Exam ready' },
  { id: 'advanced', label: 'Advanced', color: '#ec4899', desc: 'Deep dive' },
];
const LANGUAGES = [
  { id: 'english',  label: 'English',  flag: '🇬🇧' },
  { id: 'hinglish', label: 'Hinglish', flag: '🇮🇳' },
  { id: 'hindi',    label: 'Hindi',    flag: '🔤' },
];

interface Subject { id: string; name: string; }

const SUGGESTIONS = [
  { icon: <FaAtom />,       label: "Newton's Laws",      q: "Explain Newton's second law with formula and examples" },
  { icon: <FaCalculator />, label: 'Quadratic Formula',  q: 'How do I use the quadratic formula? Explain with an example' },
  { icon: <FaFlask />,      label: 'Photosynthesis',     q: 'Explain photosynthesis step by step with light & dark reactions' },
  { icon: <FaBrain />,      label: "Ohm's Law",          q: "What is Ohm's Law and how do I apply it in circuits?" },
  { icon: <FaBook />,       label: 'Mole Concept',       q: "Explain mole concept and Avogadro's number with a solved example" },
  { icon: <FaGraduationCap />, label: 'Trigonometry',   q: 'List the main trigonometry formulas I need for exams' },
];

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm,      '<h4 class="md-h4">$1</h4>')
    .replace(/^## (.+)$/gm,       '<h3 class="md-h3">$1</h3>')
    .replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,    '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,        '<em>$1</em>')
    .replace(/`([^`\n]+)`/g,      '<code>$1</code>')
    .replace(/💡 Quick Tip:(.*?)(?=\n|$)/g, '<div class="md-tip">💡 <strong>Quick Tip:</strong>$1</div>')
    .replace(/^\d+\.\s+(.+)$/gm,  '<li class="md-oli">$1</li>')
    .replace(/^[-•*]\s+(.+)$/gm,  '<li class="md-uli">$1</li>')
    .replace(/(<li class="md-oli">.*?<\/li>\n?)+/g, m => `<ol class="md-ol">${m}</ol>`)
    .replace(/(<li class="md-uli">.*?<\/li>\n?)+/g, m => `<ul class="md-ul">${m}</ul>`)
    .replace(/^---$/gm,           '<hr class="md-hr" />')
    .replace(/\n\n+/g,            '</p><p class="md-p">')
    .replace(/\n/g,               '<br />');
}

interface SavedSession {
  id: string; title: string; examType: string; savedAt: string;
  messages: { id: string; role: 'user' | 'assistant'; content: string }[];
}

const HISTORY_KEY = 'bba_chat_history';
function loadHistory(): SavedSession[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); } catch { return []; }
}
function saveHistory(sessions: SavedSession[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(0, 15)));
}
function uid() { return Math.random().toString(36).slice(2, 10); }

export default function AskPage() {
  const [messages,         setMessages]         = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [input,            setInput]            = useState('');
  const [isStreaming,      setIsStreaming]       = useState(false);
  const [examType,         setExamType]         = useState('General');
  const [subject,          setSubject]          = useState('');
  const [difficulty,       setDifficulty]       = useState('standard');
  const [error,            setError]            = useState('');
  const [copiedId,         setCopiedId]         = useState('');
  const [subjects,         setSubjects]         = useState<Subject[]>([]);
  const [history,          setHistory]          = useState<SavedSession[]>([]);
  const [showHistory,      setShowHistory]      = useState(false);
  const [subjectsLoading,  setSubjectsLoading]  = useState(true);
  const [isAuthenticated,  setIsAuthenticated]  = useState<boolean | null>(null);
  const [isListening,      setIsListening]      = useState(false);
  const [language,         setLanguage]         = useState('english');
  const [showSettings,     setShowSettings]     = useState(false);
  const router = useRouter();

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('Voice recognition not supported in this browser.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend   = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) { setInput(transcript); sendMessage(transcript); }
    };
    recognition.start();
  };

  useEffect(() => {
    const cached = sessionStorage.getItem('bb_subjects');
    if (cached) { setSubjects(JSON.parse(cached)); setSubjectsLoading(false); }
    fetch('/api/admin/subjects')
      .then(r => r.ok ? r.json() : [])
      .then((data: Subject[]) => {
        setSubjects(data); setSubjectsLoading(false);
        sessionStorage.setItem('bb_subjects', JSON.stringify(data));
      })
      .catch(() => setSubjectsLoading(false));
    fetch('/api/student/me').then(r => setIsAuthenticated(r.ok)).catch(() => setIsAuthenticated(false));
    setHistory(loadHistory());
    
    // Auto-open sidebar on desktop screens
    if (window.innerWidth > 768) {
      setShowHistory(true);
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const stopGeneration = useCallback(() => { abortRef.current?.abort(); }, []);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;

    if (isAuthenticated === false) {
      const freeUsed = parseInt(localStorage.getItem('bba_free_ai_used') || '0', 10);
      if (freeUsed >= 2) {
        setError('You have used your 2 free doubts! Sign in to continue.');
        setTimeout(() => router.push('/login?redirect=/ask'), 2500);
        return;
      }
      localStorage.setItem('bba_free_ai_used', (freeUsed + 1).toString());
    }

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date(), id: uid() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setError('');

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          question: text, examType: examType || undefined, subject: subject || undefined,
          difficulty, language,
          chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setMessages(prev => prev.filter(m => m.id !== userMsg.id));
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamingContent(full);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: full, timestamp: new Date(), id: uid() }]);
      setStreamingContent('');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        if (streamingContent) {
          setMessages(prev => [...prev, { role: 'assistant', content: streamingContent + '\n\n*[Stopped]*', timestamp: new Date(), id: uid() }]);
          setStreamingContent('');
        }
      } else {
        setError('Network error. Please try again.');
        setMessages(prev => prev.filter(m => m.id !== userMsg.id));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      textareaRef.current?.focus();
    }
  }, [input, isStreaming, messages, examType, subject, difficulty, streamingContent, language]);

  const regenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    const lastAiIdx = [...messages].reverse().findIndex(m => m.role === 'assistant');
    if (lastAiIdx >= 0) setMessages(prev => prev.slice(0, prev.length - 1));
    setTimeout(() => sendMessage(lastUser.content), 50);
  }, [messages, sendMessage]);

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id); setTimeout(() => setCopiedId(''), 2000);
    });
  }, []);

  const saveSession = useCallback(() => {
    if (messages.length === 0) return;
    const title = messages.find(m => m.role === 'user')?.content.slice(0, 60) ?? 'Chat';
    const session: SavedSession = {
      id: uid(), title, examType, savedAt: new Date().toISOString(),
      messages: messages.map(({ id, role, content }) => ({ id, role, content })),
    };
    const updated = [session, ...history];
    setHistory(updated); saveHistory(updated);
  }, [messages, history, examType]);

  const loadSession = useCallback((s: SavedSession) => {
    setMessages(s.messages.map(m => ({ ...m, timestamp: new Date(s.savedAt) })));
    setExamType(s.examType); setShowHistory(false); setError('');
  }, []);

  const deleteSession = useCallback((id: string) => {
    const updated = history.filter(s => s.id !== id);
    setHistory(updated); saveHistory(updated);
  }, [history]);

  const clearChat = () => { setMessages([]); setError(''); setStreamingContent(''); };
  const lastAiId  = [...messages].reverse().find(m => m.role === 'assistant')?.id;
  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div className={styles.page}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`${styles.sidebar} ${showHistory ? styles.sidebarOpen : styles.sidebarCollapsed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <SparkleIcon size={16} />
          </div>
          <span className={styles.sidebarTitle}>AI Tutor</span>
          <button className={styles.sidebarClose} onClick={() => setShowHistory(false)} title="Collapse sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
              <path d="m16 15-3-3 3-3" />
            </svg>
          </button>
        </div>

        <button className={styles.newChatBtn} onClick={() => { clearChat(); setShowHistory(false); }}>
          + New Chat
        </button>

        <div className={styles.historySection}>
          <p className={styles.historyLabel}>Recent · {history.length}/15</p>
          {history.length === 0 ? (
            <p className={styles.historyEmpty}>No saved chats yet.<br />Click 🔖 to save a conversation.</p>
          ) : (
            <div className={styles.historyList}>
              {history.map(s => (
                <div key={s.id} className={styles.historyItem}>
                  <button className={styles.historyLoad} onClick={() => loadSession(s)}>
                    <span className={styles.historyIcon}><FaBook /></span>
                    <span className={styles.historyInfo}>
                      <span className={styles.historyTitle}>{s.title}</span>
                      <span className={styles.historyMeta}>{s.examType} · {new Date(s.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </span>
                  </button>
                  <button className={styles.historyDelete} onClick={() => deleteSession(s.id)} title="Delete"><FaTimes /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar overlay */}
      {showHistory && <div className={styles.sidebarOverlay} onClick={() => setShowHistory(false)} />}

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className={styles.main}>

        {/* ── Top Bar ─────────────────────────────────────────── */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button className={styles.historyToggle} onClick={() => setShowHistory(v => !v)} title="Toggle Sidebar">
              {showHistory ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                  <path d="m16 15-3-3 3-3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                  <path d="m13 9 3 3-3 3" />
                </svg>
              )}
              {history.length > 0 && !showHistory && <span className={styles.historyBadge}>{history.length}</span>}
            </button>
            <div className={styles.brandRow}>
              <Link href="/" className={styles.homeBackBtn} title="Back to Homepage">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </Link>
              <div className={`${styles.aiOrb} ${isStreaming ? styles.aiOrbActive : ''}`}>
                <SparkleIcon size={16} />
                {isStreaming && <span className={styles.orbRing} />}
              </div>
              <div>
                <h1 className={styles.brandTitle}>AI Tutor</h1>
              </div>
            </div>
          </div>

          <div className={styles.topBarRight}>
            {hasMessages && (
              <>
                <button id="save-chat-btn" onClick={saveSession} className={styles.topBtn} title="Save chat">
                  <FaBookmark />
                </button>
                <button id="clear-chat-btn" onClick={clearChat} className={`${styles.topBtn} ${styles.topBtnDanger}`} title="Clear chat">
                  <FaTrash />
                </button>
              </>
            )}
            <button className={`${styles.topBtn} ${showSettings ? styles.topBtnActive : ''}`} onClick={() => setShowSettings(v => !v)} title="Settings">
              <FaGraduationCap />
            </button>
          </div>
        </header>

        {/* ── Settings Panel ──────────────────────────────────── */}
        {showSettings && (
          <div className={styles.settingsPanel}>
            <div className={styles.settingsRow}>
              {/* Exam type */}
              <div className={styles.settingsGroup}>
                <label className={styles.settingsLabel}>Exam</label>
                <div className={styles.chipRow}>
                  {EXAM_TYPES.map(e => (
                    <button key={e} id={`exam-${e.toLowerCase()}`}
                      onClick={() => { setExamType(e); setSubject(''); }}
                      className={`${styles.chip} ${examType === e ? styles.chipActive : ''}`}
                    >{e}</button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className={styles.settingsGroup}>
                <label className={styles.settingsLabel}>Subject</label>
                <div className={styles.selectWrapper}>
                  <select id="subject-select" value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className={styles.settingsSelect} disabled={subjectsLoading}
                  >
                    <option value="">{subjectsLoading ? 'Loading…' : 'All Subjects'}</option>
                    {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <FaChevronDown className={styles.selectArrow} />
                </div>
              </div>

              {/* Difficulty */}
              <div className={styles.settingsGroup}>
                <label className={styles.settingsLabel}>Level</label>
                <div className={styles.chipRow}>
                  {DIFFICULTY_LEVELS.map(d => (
                    <button key={d.id} id={`difficulty-${d.id}`}
                      onClick={() => setDifficulty(d.id)}
                      className={`${styles.chip} ${difficulty === d.id ? styles.chipActive : ''}`}
                      style={{ '--dc': d.color } as React.CSSProperties}
                      title={d.desc}
                    >{d.label}</button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className={styles.settingsGroup}>
                <label className={styles.settingsLabel}>Language</label>
                <div className={styles.chipRow}>
                  {LANGUAGES.map(l => (
                    <button key={l.id} id={`lang-${l.id}`}
                      onClick={() => setLanguage(l.id)}
                      className={`${styles.chip} ${language === l.id ? styles.chipActive : ''}`}
                    >{l.flag} {l.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Chat Body ──────────────────────────────────────────── */}
        <div className={styles.chatBody}>
          {!hasMessages ? (
            /* ── Empty / Welcome State ── */
            <div className={styles.welcome}>
              <div className={styles.welcomeOrb}>
                <svg 
                  width="36" 
                  height="36" 
                  viewBox="0 0 24 24" 
                  className={styles.welcomeSparkle}
                >
                  <defs>
                    <linearGradient id="welcome-sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M12 2c0 5.523 4.477 10 10 10-5.523 0-10 4.477-10 10 0-5.523-4.477-10-10-10 5.523 0 10-4.477 10-10z" 
                    fill="url(#welcome-sparkle-grad)"
                  />
                </svg>
                <div className={styles.welcomeOrbGlow} />
              </div>
              <h2 className={styles.welcomeTitle}>What do you want to learn today?</h2>
              <p className={styles.welcomeSub}>Ask any doubt in Science, Math, or any subject. I'll explain step-by-step.</p>

              {/* Active settings display */}
              <div className={styles.activeSettings}>
                <span className={styles.activePill}>{examType}</span>
                <span className={styles.activePill} style={{ color: DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.color }}>
                  {DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.label}
                </span>
                <span className={styles.activePill}>{LANGUAGES.find(l => l.id === language)?.flag} {LANGUAGES.find(l => l.id === language)?.label}</span>
                <button className={styles.changeBtn} onClick={() => setShowSettings(v => !v)}>
                  Change settings ↗
                </button>
              </div>

              <div className={styles.suggestGrid}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} id={`suggestion-${i}`} className={styles.suggestCard} onClick={() => sendMessage(s.q)}>
                    <span className={styles.suggestIcon}>{s.icon}</span>
                    <span className={styles.suggestLabel}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Messages ── */
            <div className={styles.messageList}>
              {messages.map((msg, idx) => (
                <div key={msg.id} className={msg.role === 'user' ? styles.userMessageRow : styles.aiMessageRow}
                  style={{ animationDelay: `${idx * 0.04}s` }}>

                  {msg.role === 'user' ? (
                    <div className={styles.userBubble}>
                      <p className={styles.userText}>{msg.content}</p>
                      <span className={styles.userMsgTime}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ) : (
                    <div className={styles.aiCard}>
                      <div className={styles.aiCardHeader}>
                        <div className={styles.aiCardHeaderLeft}>
                          <SparkleIcon size={13} className={styles.aiCardSparkle} />
                          <span>AI Tutor</span>
                        </div>
                        <div className={styles.aiCardHeaderRight}>
                          <button className={styles.cardActionBtn} onClick={() => copyToClipboard(msg.content, msg.id)}>
                            {copiedId === msg.id ? <><FaCheck size={10} /> Copied</> : <><FaCopy size={10} /> Copy</>}
                          </button>
                          {msg.id === lastAiId && (
                            <button className={styles.cardActionBtn} onClick={regenerate} disabled={isStreaming}>
                              <FaRedo size={10} /> Retry
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={styles.aiCardBody}>
                        <div className={styles.markdownContent}
                          dangerouslySetInnerHTML={{ __html: `<p class="md-p">${renderMarkdown(msg.content)}</p>` }}
                        />
                      </div>
                      <div className={styles.aiCardFooter}>
                        <span className={styles.msgTime}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming bubble */}
              {isStreaming && (
                <div className={styles.aiMessageRow}>
                  <div className={styles.aiCard}>
                    <div className={styles.aiCardHeader}>
                      <div className={styles.aiCardHeaderLeft}>
                        <SparkleIcon size={13} className={styles.aiCardSparkle} />
                        <span>AI Tutor</span>
                      </div>
                      <div className={styles.aiCardHeaderRight}>
                        <span className={styles.thinkingStatus}>Generating...</span>
                      </div>
                    </div>
                    <div className={styles.aiCardBody}>
                      {streamingContent ? (
                        <div className={styles.markdownContent}
                          dangerouslySetInnerHTML={{ __html: `<p class="md-p">${renderMarkdown(streamingContent)}</p><span class="typing-cursor">▍</span>` }}
                        />
                      ) : (
                        <div className={styles.thinkingRow}>
                          <div className={styles.thinkingDots}><span /><span /><span /></div>
                          <span className={styles.thinkingText}>Thinking…</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {error && <div className={styles.errorBanner}>⚠️ {error}</div>}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* ── Input Bar ────────────────────────────────────────── */}
        <div className={styles.inputArea}>
          <div className={`${styles.inputBox} ${isStreaming ? styles.inputBoxStreaming : ''}`}>
            <button type="button"
              className={`${styles.micBtn} ${isListening ? styles.micActive : ''}`}
              onClick={startListening} title="Voice input"
            >
              <FaMicrophone />
            </button>

            <textarea ref={textareaRef} id="question-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask any doubt… (Shift+Enter for new line)"
              className={styles.textarea}
              rows={1}
              disabled={isStreaming}
            />

            {input.length > 2500 && <span className={styles.charWarn}>{input.length}/3000</span>}

            {isStreaming ? (
              <button id="stop-btn" onClick={stopGeneration} className={styles.stopBtn}>
                <FaStop />
                <span>Stop</span>
              </button>
            ) : (
              <button id="send-btn" onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming} className={styles.sendBtn}
              >
                <FaPaperPlane />
              </button>
            )}
          </div>
          <p className={styles.disclaimer}>AI may make mistakes · Always verify with your teacher or textbook</p>
        </div>
      </main>
    </div>
  );
}
