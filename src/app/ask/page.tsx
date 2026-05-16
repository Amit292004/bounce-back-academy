'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaPaperPlane, FaRobot, FaUser, FaTrash, FaLightbulb,
  FaStop, FaCopy, FaCheck, FaRedo, FaHistory, FaBookmark,
  FaMicrophone
} from 'react-icons/fa';
import styles from './ask.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
  image?: string;
}

const EXAM_TYPES = ['General', 'NBSE', 'JEE', 'NEET', 'CUET'];
const DIFFICULTY_LEVELS = [
  { id: 'basic',    label: 'Basic',    color: '#10b981' },
  { id: 'standard', label: 'Standard', color: '#6366f1' },
  { id: 'advanced', label: 'Advanced', color: '#ec4899' },
];

interface Subject { id: string; name: string; }
const SUGGESTIONS = [
  { label: "Newton's 2nd Law",    q: "Explain Newton's second law with formula and example" },
  { label: 'Quadratic Formula',   q: 'How do I use the quadratic formula? Explain with an example' },
  { label: 'Photosynthesis',      q: 'Explain photosynthesis step by step with light & dark reactions' },
  { label: "Ohm's Law",           q: "What is Ohm's Law and how do I apply it in circuits?" },
  { label: 'Mole Concept',        q: "Explain mole concept and Avogadro's number with a solved example" },
  { label: 'Trigonometry',        q: 'List the main trigonometry formulas I need for exams' },
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
  id: string;
  title: string;
  examType: string;
  savedAt: string;
  messages: { id: string; role: 'user' | 'assistant'; content: string; image?: string }[];
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
  const router = useRouter();

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Recognition Setup
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput(transcript);
        sendMessage(transcript);
      }
    };
    
    recognition.start();
  };

  // Fetch subjects from DB on mount (cached in sessionStorage)
  useEffect(() => {
    const cached = sessionStorage.getItem('bb_subjects');
    if (cached) {
      setSubjects(JSON.parse(cached));
      setSubjectsLoading(false);
    }
    fetch('/api/admin/subjects')
      .then(r => r.ok ? r.json() : [])
      .then((data: Subject[]) => {
        setSubjects(data);
        setSubjectsLoading(false);
        sessionStorage.setItem('bb_subjects', JSON.stringify(data));
      })
      .catch(() => setSubjectsLoading(false));

    // Check authentication
    fetch('/api/student/me')
      .then(r => setIsAuthenticated(r.ok))
      .catch(() => setIsAuthenticated(false));
  }, []);


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const stopGeneration = useCallback(() => { abortRef.current?.abort(); }, []);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;

    // Free limit check for unauthenticated users
    if (isAuthenticated === false) {
      const freeUsed = parseInt(localStorage.getItem('bba_free_ai_used') || '0', 10);
      if (freeUsed >= 2) {
        setError('You have reached the 2 free doubts limit! Redirecting to sign in...');
        setTimeout(() => router.push('/login?redirect=/ask'), 2500);
        return;
      }
      localStorage.setItem('bba_free_ai_used', (freeUsed + 1).toString());
    }

    const userMsg: Message = { 
      role: 'user', 
      content: text, 
      timestamp: new Date(), 
      id: uid(),
    };
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
          question: text,
          examType:   examType  || undefined,
          subject:    subject   || undefined,
          difficulty,
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
  }, [input, isStreaming, messages, examType, subject, difficulty, streamingContent]);

  const regenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    const lastAiIdx = [...messages].reverse().findIndex(m => m.role === 'assistant');
    if (lastAiIdx >= 0) setMessages(prev => prev.slice(0, prev.length - 1));
    setTimeout(() => sendMessage(lastUser.content), 50);
  }, [messages, sendMessage]);

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    });
  }, []);

  // Load history on mount
  useEffect(() => { setHistory(loadHistory()); }, []);

  const saveSession = useCallback(() => {
    if (messages.length === 0) return;
    const title = messages.find(m => m.role === 'user')?.content.slice(0, 60) ?? 'Chat';
    const session: SavedSession = {
      id: uid(), title, examType,
      savedAt: new Date().toISOString(),
      messages: messages.map(({ id, role, content, image }) => ({ id, role, content, image })),
    };
    const updated = [session, ...history];
    setHistory(updated);
    saveHistory(updated);
  }, [messages, history, examType]);

  const loadSession = useCallback((s: SavedSession) => {
    setMessages(s.messages.map(m => ({ ...m, timestamp: new Date(s.savedAt) })));
    setExamType(s.examType);
    setShowHistory(false);
    setError('');
  }, []);

  const deleteSession = useCallback((id: string) => {
    const updated = history.filter(s => s.id !== id);
    setHistory(updated);
    saveHistory(updated);
  }, [history]);

  const clearChat = () => { setMessages([]); setError(''); setStreamingContent(''); };
  const lastAiId  = [...messages].reverse().find(m => m.role === 'assistant')?.id;

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className={styles.header}>
        {/* Title row */}
        <div className={styles.titleRow}>
          <div className={styles.aiIcon}>
            <FaRobot />
            {isStreaming && <span className={styles.liveRing} />}
          </div>
          <div>
            <h1 className={styles.title}>Bounce Back <span className="kinetic-text">AI Tutor</span></h1>
            <p className={styles.subtitle}>Your free personal tutor · NBSE · JEE · NEET · CUET</p>
          </div>
          <div className={styles.headerBtns}>
            {messages.length > 0 && (
              <>
                <button id="save-chat-btn" onClick={saveSession} className={styles.iconBtn} title="Save this chat">
                  <FaBookmark />
                </button>
                <button id="clear-chat-btn" onClick={clearChat} className={styles.clearBtn} title="Clear chat">
                  <FaTrash />
                </button>
              </>
            )}
            <button
              id="history-btn"
              onClick={() => setShowHistory(v => !v)}
              className={`${styles.iconBtn} ${showHistory ? styles.iconBtnActive : ''}`}
              title="Chat history"
            >
              <FaHistory />
              {history.length > 0 && <span className={styles.badge}>{history.length}</span>}
            </button>
          </div>
        </div>

        {/* Exam + Subject + Difficulty in one compact row */}
        <div className={styles.controlsBar}>
          {/* Exam pills */}
          <div className={styles.controlGroup}>
            {EXAM_TYPES.map(e => (
              <button
                key={e} id={`exam-${e.toLowerCase()}`}
                onClick={() => { setExamType(e); setSubject(''); }}
                className={`${styles.pill} ${examType === e ? styles.pillActive : ''}`}
              >{e}</button>
            ))}
          </div>

          {/* Subject dropdown — fetched live from DB */}
          <select
            id="subject-select"
            value={subject}
            onChange={e => { setSubject(e.target.value); }}
            className={styles.subjectSelect}
            disabled={subjectsLoading}
          >
            <option value="">{subjectsLoading ? 'Loading...' : 'All Subjects'}</option>
            {subjects.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>

          {/* Difficulty pills */}
          <div className={styles.controlGroup}>
            {DIFFICULTY_LEVELS.map(d => (
              <button
                key={d.id} id={`difficulty-${d.id}`}
                onClick={() => setDifficulty(d.id)}
                className={`${styles.diffPill} ${difficulty === d.id ? styles.diffPillActive : ''}`}
                style={{ '--dc': d.color } as React.CSSProperties}
              >{d.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── History Panel ────────────────────────────────────────── */}
      {showHistory && (
        <div className={styles.historyPanel}>
          <div className={styles.historyHeader}>
            <span>Saved Chats</span>
            <span className={styles.historyCount}>{history.length} / 15</span>
          </div>
          {history.length === 0 ? (
            <p className={styles.historyEmpty}>No saved chats yet. Click 🔖 after a conversation to save it.</p>
          ) : (
            <div className={styles.historyList}>
              {history.map(s => (
                <div key={s.id} className={styles.historyItem}>
                  <button className={styles.historyLoad} onClick={() => loadSession(s)}>
                    <span className={styles.historyTitle}>{s.title}</span>
                    <span className={styles.historyMeta}>
                      {s.examType} · {new Date(s.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </button>
                  <button className={styles.historyDelete} onClick={() => deleteSession(s.id)} title="Delete">
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Chat Area ───────────────────────────────────────────────── */}
      <div className={styles.chatArea}>
        {messages.length === 0 && !isStreaming ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FaLightbulb /></div>
            <h2 className={styles.emptyTitle}>Ask me anything!</h2>
            <p className={styles.emptySubtitle}>
              Step-by-step answers · NBSE · JEE · NEET · CUET
            </p>
            <div className={styles.suggestGrid}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} id={`suggestion-${i}`} className={styles.suggestCard} onClick={() => sendMessage(s.q)}>
                  <span className={styles.suggestLabel}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.messageList}>
            {messages.map(msg => (
              <div key={msg.id} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.aiRow}`}>
                <div className={`${styles.avatar} ${msg.role === 'user' ? styles.userAvatar : styles.aiAvatar}`}>
                  {msg.role === 'user' ? <FaUser /> : <FaRobot />}
                </div>
                <div className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.aiBubble}`}>
                  {msg.role === 'assistant' ? (
                    <>
                      <div
                        className={styles.markdownContent}
                        dangerouslySetInnerHTML={{ __html: `<p class="md-p">${renderMarkdown(msg.content)}</p>` }}
                      />
                      <div className={styles.msgActions}>
                        <span className={styles.msgTime}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button className={styles.actionBtn} onClick={() => copyToClipboard(msg.content, msg.id)}>
                          {copiedId === msg.id ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
                        </button>
                        {msg.id === lastAiId && (
                          <button className={styles.actionBtn} onClick={regenerate} disabled={isStreaming}>
                            <FaRedo /> Retry
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className={styles.userText}>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming bubble - Last in DOM = Top visually in column-reverse */}
            {isStreaming && (
              <div className={`${styles.messageRow} ${styles.aiRow}`}>
                <div className={`${styles.avatar} ${styles.aiAvatar}`}><FaRobot /></div>
                <div className={`${styles.bubble} ${styles.aiBubble}`}>
                  {streamingContent ? (
                    <div
                      className={styles.markdownContent}
                      dangerouslySetInnerHTML={{ __html: `<p class="md-p">${renderMarkdown(streamingContent)}</p><span class="typing-cursor">▍</span>` }}
                    />
                  ) : (
                    <div className={styles.thinking}>
                      <div className={styles.thinkingDots}><span /><span /><span /></div>
                      <span className={styles.thinkingText}>Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && <div className={styles.errorBanner}>⚠️ {error}</div>}
          </div>
        )}
      </div>

      {/* ── Input Area ──────────────────────────────────────────────── */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <button 
            type="button" 
            className={`${styles.toolBtn} ${isListening ? styles.micActive : ''}`} 
            onClick={startListening}
            title="Voice search"
          >
            <FaMicrophone />
          </button>
          <textarea
            ref={textareaRef}
            id="question-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask your doubt here..."
            className={styles.textarea}
            rows={1}
            disabled={isStreaming}
          />
          {input.length > 2500 && (
            <span className={styles.charWarn}>{input.length}/3000</span>
          )}
          {isStreaming ? (
            <button id="stop-btn" onClick={stopGeneration} className={styles.stopBtn}><FaStop /></button>
          ) : (
            <button 
              id="send-btn" 
              onClick={() => sendMessage()} 
              disabled={!input.trim() || isStreaming} 
              className={styles.sendBtn}
            >
              <FaPaperPlane />
            </button>
          )}
        </div>
        <p className={styles.disclaimer}>AI can make mistakes · Verify with your teacher or textbook</p>
      </div>
    </div>
  );
}
