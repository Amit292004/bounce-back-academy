'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  Sparkles,
  Send,
  Square,
  Mic,
  Search,
  Trash2,
  Bookmark,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  ListOrdered,
  CheckCircle2,
  Compass,
  Atom,
  Calculator,
  GraduationCap,
  Plus,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
  AlertCircle,
  Printer,
  Maximize2,
  Minimize2,
  Zap
} from 'lucide-react';
import styles from './ask.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
}

interface SavedSession {
  id: string;
  title: string;
  examType: string;
  savedAt: string;
  messages: { id: string; role: 'user' | 'assistant'; content: string }[];
}

interface Subject {
  id: string;
  name: string;
}

const EXAM_TYPES = ['General', 'NBSE', 'CBSE', 'JEE', 'NEET', 'CUET'];

const DIFFICULTY_LEVELS = [
  { id: 'basic', label: 'Foundational', desc: 'Step-by-step conceptual basics' },
  { id: 'standard', label: 'Standard', desc: 'Balanced board & exam preparation' },
  { id: 'advanced', label: 'Advanced', desc: 'Rigorous competitive depth' },
];

const LANGUAGES = [
  { id: 'english', label: 'English' },
  { id: 'hinglish', label: 'Hinglish' },
  { id: 'hindi', label: 'Hindi' },
];

interface StarterPrompt {
  id: string;
  category: string;
  title: string;
  question: string;
  icon: typeof Calculator;
}

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: 'math',
    category: 'Mathematics',
    title: 'Calculus & Derivations',
    question: 'Find the integral of (x² + 1) / (x⁴ + 1) dx with complete algebraic substitution steps.',
    icon: Calculator,
  },
  {
    id: 'science',
    category: 'Sciences',
    title: 'Principles & Physical Laws',
    question: 'Derive the kinematic equation v² = u² + 2as using calculus and state its physical conditions.',
    icon: Atom,
  },
  {
    id: 'humanities',
    category: 'Social Science & Commerce',
    title: 'Concepts & Economic Analysis',
    question: 'Explain the circular flow of income in a macroeconomy with injections, leakages, and equilibrium.',
    icon: BookOpen,
  },
  {
    id: 'exam',
    category: 'Exam Strategy',
    title: 'Board & Competitive Scoring',
    question: 'How should I structure 5-mark answers in board examinations to guarantee maximum step marks?',
    icon: GraduationCap,
  },
];


const HISTORY_KEY = 'bba_chat_history';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function loadHistory(): SavedSession[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveHistory(sessions: SavedSession[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(0, 25)));
}

/**
 * Publication-grade renderer using KaTeX for formulas and clean markdown for code/text
 */
function renderCleanMarkdown(text: string): string {
  let out = text;

  // 1. Block math: $$ ... $$
  out = out.replace(/\$\$([\s\S]*?)\$\$/g, (_match, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
      return `<div class="${styles.katexBlock}">${rendered}</div>`;
    } catch {
      return `<div class="${styles.katexBlock}"><code>${math.trim()}</code></div>`;
    }
  });

  // 2. Inline math: $ ... $
  out = out.replace(/\$([^\$\n]+)\$/g, (_match, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="${styles.mathExpr}">${math.trim()}</span>`;
    }
  });

  // 3. Code blocks ```lang ... ```
  out = out.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div class="${styles.codeBlockContainer}">
      <div class="${styles.codeBlockHeader}"><span>${(lang || 'CODE').toUpperCase()}</span></div>
      <pre class="${styles.codePre}"><code>${escaped.trim()}</code></pre>
    </div>`;
  });

  // 4. Bold & Italic
  out = out.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^\*\n]+)\*/g, '<em>$1</em>');

  // 5. Inline code
  out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // 6. Lists
  out = out.replace(/^\d+\.\s+(.+)$/gm, '<li class="clean-oli" style="margin-bottom:0.25rem;">$1</li>');
  out = out.replace(/^[-•*]\s+(.+)$/gm, '<li class="clean-uli" style="margin-bottom:0.25rem;">$1</li>');
  out = out.replace(/(<li class="clean-oli">.*?<\/li>\n?)+/g, m => `<ol style="padding-left:1.3rem;margin:0.5rem 0;">${m}</ol>`);
  out = out.replace(/(<li class="clean-uli">.*?<\/li>\n?)+/g, m => `<ul style="padding-left:1.3rem;margin:0.5rem 0;list-style:disc;">${m}</ul>`);

  // 7. Paragraphs
  out = out.replace(/\n\n+/g, '</p><p>');
  out = out.replace(/\n/g, '<br />');

  return `<p>${out}</p>`;
}

interface ParsedSections {
  topic?: string;
  concept?: string;
  solution?: string;
  finalAnswer?: string;
  takeaway?: string;
  unstructured?: string;
}

/**
 * Extracts standard structured academic sections from AI response
 */
function parseAcademicSections(rawText: string): ParsedSections {
  const sections: ParsedSections = {};

  const topicMatch = rawText.match(/##\s*Topic\s*\n([\s\S]*?)(?=##\s*Concept|##\s*Step-by-Step Solution|##\s*Final Answer|##\s*Key Takeaway|$)/i);
  const conceptMatch = rawText.match(/##\s*Concept\s*\n([\s\S]*?)(?=##\s*Step-by-Step Solution|##\s*Final Answer|##\s*Key Takeaway|$)/i);
  const solutionMatch = rawText.match(/##\s*Step-by-Step Solution\s*\n([\s\S]*?)(?=##\s*Final Answer|##\s*Key Takeaway|$)/i);
  const finalAnswerMatch = rawText.match(/##\s*Final Answer\s*\n([\s\S]*?)(?=##\s*Key Takeaway|$)/i);
  const takeawayMatch = rawText.match(/##\s*Key Takeaway\s*\n([\s\S]*?$)/i);

  if (topicMatch || conceptMatch || solutionMatch || finalAnswerMatch || takeawayMatch) {
    if (topicMatch) sections.topic = topicMatch[1].trim();
    if (conceptMatch) sections.concept = conceptMatch[1].trim();
    if (solutionMatch) sections.solution = solutionMatch[1].trim();
    if (finalAnswerMatch) sections.finalAnswer = finalAnswerMatch[1].trim();
    if (takeawayMatch) sections.takeaway = takeawayMatch[1].trim();
    return sections;
  }

  sections.unstructured = rawText;
  return sections;
}

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [examType, setExamType] = useState('General');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('standard');
  const [language, setLanguage] = useState('english');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('bb_subjects');
        if (cached) return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [history, setHistory] = useState<SavedSession[]>(() => {
    if (typeof window !== 'undefined') {
      return loadHistory();
    }
    return [];
  });
  const [historySearch, setHistorySearch] = useState('');
  const [showHistory, setShowHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 960;
    }
    return false;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop voice listening cleanly
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Initialize data
  useEffect(() => {
    fetch('/api/admin/subjects')
      .then(r => (r.ok ? r.json() : []))
      .then((data: Subject[]) => {
        setSubjects(data);
        sessionStorage.setItem('bb_subjects', JSON.stringify(data));
      })
      .catch(() => {});

    fetch('/api/student/me')
      .then(r => (r.ok ? r.json() : { authenticated: false }))
      .then(data => setIsAuthenticated(Boolean(data?.authenticated)))
      .catch(() => setIsAuthenticated(false));
  }, []);

  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Auto-scroll on new message or error
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, error]);

  // Cleanup timers & speech on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Speech Recognition (Voice Dictation - Streams words in real-time, no premature cutoffs)
  const startListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    interface SpeechResultItem {
      transcript: string;
    }
    interface SpeechResult {
      isFinal: boolean;
      [index: number]: SpeechResultItem;
    }
    interface SpeechEvent {
      resultIndex: number;
      results: {
        length: number;
        [index: number]: SpeechResult;
      };
    }
    interface SpeechInstance {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onstart: () => void;
      onend: () => void;
      onerror: (e: { error: string }) => void;
      onresult: (event: SpeechEvent) => void;
      start: () => void;
      stop: () => void;
    }
    interface SpeechConstructor {
      new (): SpeechInstance;
    }

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: SpeechConstructor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechConstructor }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = language === 'hindi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e: { error: string }) => {
        if (e.error !== 'no-speech') {
          console.warn('[Voice Recognition]', e.error);
        }
        setIsListening(false);
      };

      recognition.onresult = (event: SpeechEvent) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }

        const trimmed = fullTranscript.trim();
        if (trimmed) {
          setInput(trimmed);
        }

        // Reset silence timer on every spoken word
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Auto-stop listening after 3.5s of silence so the mic isn't left on,
        // but keep the text in the input box so the student can review and click Send
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
        }, 3500);
      };

      recognition.start();
    } catch (err) {
      console.error('[Voice] Failed to start:', err);
      setIsListening(false);
    }
  }, [isListening, language, stopListening]);

  // Text-to-Speech (Audio Read-Aloud)
  const toggleSpeech = (text: string, msgId: string, rate = speechRate) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setError('Speech synthesis is not supported on this device.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMsgId(msgId);

    // Clean markdown and LaTeX syntax for smooth natural speech
    const cleanSpeechText = text
      .replace(/##+/g, '')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/\$\$[\s\S]*?\$\$/g, 'Mathematical equation.')
      .replace(/\$([^\$\n]+)\$/g, '$1')
      .replace(/[*_`#]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.lang = language === 'hindi' ? 'hi-IN' : 'en-US';

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Stop generation
  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (overrideText?: string) => {
      stopListening();

      const text = (overrideText ?? input).trim();
      if (!text || isStreaming) return;

      if (isAuthenticated === false) {
        const freeUsed = parseInt(localStorage.getItem('bba_free_ai_used') || '0', 10);
        if (freeUsed >= 2) {
          setError('Free quota limit reached (2 doubts). Please sign in to continue.');
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
            question: text,
            examType: examType || undefined,
            subject: subject || undefined,
            difficulty,
            language,
            chatHistory: messages.slice(-4).map(m => ({ role: m.role, content: m.content })),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errMsg = data.error || 'Failed to generate solution. Please try again.';
          setError(errMsg);
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `**Error:** ${errMsg}\n\nPlease click **Retry** or ask another question.`,
              timestamp: new Date(),
              id: uid(),
            },
          ]);
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
            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: streamingContent + '\n\n*(Generation stopped by user)*', timestamp: new Date(), id: uid() },
            ]);
            setStreamingContent('');
          }
        } else {
          const errMsg = 'Connection interrupted or timed out. Please retry.';
          setError(errMsg);
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `**Error:** ${errMsg}\n\nPlease verify your connection and try again.`,
              timestamp: new Date(),
              id: uid(),
            },
          ]);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        textareaRef.current?.focus();
      }
    },
    [input, isStreaming, messages, examType, subject, difficulty, language, isAuthenticated, router, streamingContent, stopListening]
  );

  // Regenerate latest response
  const regenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    const lastAiIdx = [...messages].reverse().findIndex(m => m.role === 'assistant');
    if (lastAiIdx >= 0) {
      setMessages(prev => prev.slice(0, prev.length - 1));
    }
    setTimeout(() => sendMessage(lastUser.content), 50);
  }, [messages, sendMessage]);

  // Copy text to clipboard
  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    });
  }, []);

  // Print solution as PDF
  const printSolution = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Save session
  const saveSession = useCallback(() => {
    if (messages.length === 0) return;
    const title = messages.find(m => m.role === 'user')?.content.slice(0, 50) ?? 'Academic Session';
    const session: SavedSession = {
      id: uid(),
      title,
      examType,
      savedAt: new Date().toISOString(),
      messages: messages.map(({ id, role, content }) => ({ id, role, content })),
    };
    const updated = [session, ...history];
    setHistory(updated);
    saveHistory(updated);
  }, [messages, history, examType]);

  // Load session
  const loadSession = useCallback((s: SavedSession) => {
    setMessages(s.messages.map(m => ({ ...m, timestamp: new Date(s.savedAt) })));
    setExamType(s.examType);
    if (window.innerWidth <= 768) {
      setShowHistory(false);
    }
    setError('');
  }, []);

  // Delete session
  const deleteSession = useCallback(
    (id: string) => {
      const updated = history.filter(s => s.id !== id);
      setHistory(updated);
      saveHistory(updated);
    },
    [history]
  );

  const clearChat = () => {
    setMessages([]);
    setError('');
    setStreamingContent('');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
  };

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history;
    const q = historySearch.toLowerCase();
    return history.filter(s => s.title.toLowerCase().includes(q) || s.examType.toLowerCase().includes(q));
  }, [history, historySearch]);

  const lastAiId = [...messages].reverse().find(m => m.role === 'assistant')?.id;
  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div className={`${styles.page} ${isFocusMode ? styles.focusMode : ''}`}>
      {/* ==================================================================
          SIDEBAR: STUDY VAULT
          ================================================================== */}
      {!isFocusMode && (
        <aside className={`${styles.sidebar} ${showHistory ? styles.sidebarOpen : styles.sidebarCollapsed}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarBrand}>
              <BookOpen size={15} />
              <span>Study Vault</span>
            </div>
            <button className={styles.sidebarCloseBtn} onClick={() => setShowHistory(false)} title="Close Vault">
              <PanelLeftClose size={15} />
            </button>
          </div>

          <div className={styles.sidebarActions}>
            <button
              className={styles.newChatBtn}
              onClick={() => {
                clearChat();
                if (window.innerWidth <= 768) setShowHistory(false);
              }}
            >
              <Plus size={14} />
              <span>New Session</span>
            </button>

            <div className={styles.searchBox}>
              <Search size={13} />
              <input
                type="text"
                placeholder="Search saved doubts..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.historyList}>
            {filteredHistory.length === 0 ? (
              <div className={styles.historyEmpty}>
                <p>No saved sessions yet.</p>
                <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>Bookmark solutions to review later.</span>
              </div>
            ) : (
              <>
                <div className={styles.historyGroupTitle}>Recent Doubts ({filteredHistory.length})</div>
                {filteredHistory.map(s => (
                  <div key={s.id} className={styles.historyItem}>
                    <button className={styles.historyBtn} onClick={() => loadSession(s)}>
                      <BookOpen size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
                      <span className={styles.historyText}>{s.title}</span>
                    </button>
                    <button
                      className={styles.historyDeleteBtn}
                      onClick={e => {
                        e.stopPropagation();
                        deleteSession(s.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>
      )}

      {/* Mobile Overlay */}
      {showHistory && !isFocusMode && <div className={styles.sidebarOverlay} onClick={() => setShowHistory(false)} />}

      {/* ==================================================================
          MAIN INTERFACE
          ================================================================== */}
      <main className={styles.main}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            {!isFocusMode && (
              <button
                className={styles.iconButton}
                onClick={() => setShowHistory(v => !v)}
                title={showHistory ? 'Collapse Vault' : 'Open Vault'}
              >
                {showHistory ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
              </button>
            )}

            <Link href="/" className={styles.iconButton} title="Return to Academy Homepage">
              <ArrowLeft size={15} />
            </Link>

            <div className={styles.brandGroup}>
              <h1 className={styles.brandTitle}>Bounce Back AI</h1>
              <span className={styles.statusIndicator}>
                <span className={styles.liveDot} />
                <Zap size={11} />
                <span>Qwen 3.8 AI Core</span>
              </span>
            </div>
          </div>

          <div className={styles.topBarRight}>
            {hasMessages && (
              <>
                <button className={styles.iconButton} onClick={printSolution} title="Print Solution PDF">
                  <Printer size={14} />
                </button>
                <button className={styles.iconButton} onClick={saveSession} title="Bookmark Session">
                  <Bookmark size={14} />
                </button>
                <button
                  className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                  onClick={clearChat}
                  title="Clear Conversation"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button
              className={`${styles.iconButton} ${isFocusMode ? styles.iconButtonActive : ''}`}
              onClick={() => setIsFocusMode(v => !v)}
              title={isFocusMode ? 'Exit Focus Mode' : 'Focus Mode'}
            >
              {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              className={`${styles.iconButton} ${showSettings ? styles.iconButtonActive : ''}`}
              onClick={() => setShowSettings(v => !v)}
              title="Curriculum Settings"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </header>

        {/* Settings Flyout Panel */}
        {showSettings && (
          <div className={styles.settingsDrawer}>
            <div className={styles.settingsSection}>
              <label className={styles.settingsLabel}>
                <GraduationCap size={13} /> Target Exam
              </label>
              <div className={styles.chipGroup}>
                {EXAM_TYPES.map(e => (
                  <button
                    key={e}
                    onClick={() => {
                      setExamType(e);
                      setSubject('');
                    }}
                    className={`${styles.settingChip} ${examType === e ? styles.settingChipActive : ''}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.settingsSection}>
              <label className={styles.settingsLabel}>
                <BookOpen size={13} /> Subject Filter
              </label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className={styles.selectInput}
              >
                <option value="">All Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.settingsSection}>
              <label className={styles.settingsLabel}>
                <Compass size={13} /> Solution Depth
              </label>
              <div className={styles.chipGroup}>
                {DIFFICULTY_LEVELS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`${styles.settingChip} ${difficulty === d.id ? styles.settingChipActive : ''}`}
                    title={d.desc}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.settingsSection}>
              <label className={styles.settingsLabel}>
                <Lightbulb size={13} /> Language
              </label>
              <div className={styles.chipGroup}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    className={`${styles.settingChip} ${language === l.id ? styles.settingChipActive : ''}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Body */}
        <div className={styles.chatBody}>
          {!hasMessages ? (
            /* ==========================================================
               EMPTY STATE: MINIMAL & CLEAN
               ========================================================== */
            <div className={styles.welcomeContainer}>
              <div className={styles.welcomeBadge}>
                <Sparkles size={12} />
                <span>Academic Problem Solver</span>
              </div>

              <h2 className={styles.welcomeTitle}>What would you like to solve today?</h2>
              <p className={styles.welcomeSub}>
                Instant step-by-step solutions, scientific derivations, and conceptual clarity across all academic subjects and competitive exams.
              </p>

              {error && (
                <div className={styles.errorCard} style={{ marginBottom: '1.25rem', width: '100%', maxWidth: '820px' }}>
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {/* Suggested Academic Questions Across Subjects */}
              <div className={styles.promptGrid}>
                {STARTER_PROMPTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={styles.promptCard}
                      onClick={() => sendMessage(item.question)}
                    >
                      <div className={styles.promptCardTop}>
                        <div className={styles.promptCardIconWrap}>
                          <Icon size={14} />
                        </div>
                        <span className={styles.promptCardCategory}>{item.category}</span>
                      </div>
                      <h3 className={styles.promptCardTitle}>{item.title}</h3>
                      <p className={styles.promptCardText}>{item.question}</p>
                      <div className={styles.promptCardAction}>
                        <span>Solve with Full Steps</span>
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ==========================================================
               MESSAGE STREAM & THREAD
               ========================================================== */
            <div className={styles.messageList}>
              {messages.map(msg => (
                <div key={msg.id} className={msg.role === 'user' ? styles.userRow : styles.aiRow}>
                  {msg.role === 'user' ? (
                    <div className={styles.userCard}>
                      <p className={styles.userText}>{msg.content}</p>
                      <div className={styles.userMeta}>
                        <span>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.aiResponseCard}>
                      {/* Card Header */}
                      <div className={styles.aiCardHeader}>
                        <div className={styles.aiCardHeaderLeft}>
                          <Sparkles size={13} color="var(--ai-accent)" />
                          <span>Academic Solution</span>
                        </div>
                        <div className={styles.aiCardHeaderRight}>
                          {speakingMsgId === msg.id && (
                            <div className={styles.audioPlayerRow}>
                              <div className={styles.soundwave}>
                                <span />
                                <span />
                                <span />
                                <span />
                              </div>
                              <select
                                className={styles.speedSelector}
                                value={speechRate}
                                onChange={e => {
                                  const r = parseFloat(e.target.value);
                                  setSpeechRate(r);
                                  toggleSpeech(msg.content, msg.id, r);
                                }}
                              >
                                <option value="1.0">1.0x</option>
                                <option value="1.25">1.25x</option>
                                <option value="1.5">1.5x</option>
                              </select>
                            </div>
                          )}

                          <button
                            className={`${styles.cardActionBtn} ${speakingMsgId === msg.id ? styles.cardActionBtnActive : ''}`}
                            onClick={() => toggleSpeech(msg.content, msg.id)}
                            title={speakingMsgId === msg.id ? 'Stop Speech' : 'Listen'}
                          >
                            {speakingMsgId === msg.id ? (
                              <>
                                <VolumeX size={12} />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 size={12} />
                                <span>Listen</span>
                              </>
                            )}
                          </button>

                          <button
                            className={styles.cardActionBtn}
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            title="Copy Solution"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={12} />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {msg.id === lastAiId && (
                            <button
                              className={styles.cardActionBtn}
                              onClick={regenerate}
                              disabled={isStreaming}
                              title="Regenerate"
                            >
                              <RotateCcw size={12} />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Structured Academic Body */}
                      <div className={styles.aiCardBody}>
                        {(() => {
                          const sections = parseAcademicSections(msg.content);

                          if (sections.unstructured) {
                            return (
                              <div
                                className={styles.markdownBody}
                                dangerouslySetInnerHTML={{
                                  __html: renderCleanMarkdown(sections.unstructured),
                                }}
                              />
                            );
                          }

                          return (
                            <>
                              {/* 1. Topic */}
                              {sections.topic && (
                                <div className={styles.topicCard}>
                                  <div className={styles.topicCardLeft}>
                                    <BookOpen size={14} style={{ flexShrink: 0 }} />
                                    <span>{sections.topic}</span>
                                  </div>
                                  <span className={styles.curriculumBadge}>Curriculum Aligned</span>
                                </div>
                              )}

                              {/* 2. Core Concept */}
                              {sections.concept && (
                                <div className={styles.conceptCard}>
                                  <div className={styles.sectionHeader}>
                                    <Lightbulb size={13} />
                                    <span>Core Concept & Physical Intuition</span>
                                  </div>
                                  <div
                                    className={styles.markdownBody}
                                    dangerouslySetInnerHTML={{
                                      __html: renderCleanMarkdown(sections.concept),
                                    }}
                                  />
                                </div>
                              )}

                              {/* 3. Step-by-Step Solution */}
                              {sections.solution && (
                                <div className={styles.stepContainer}>
                                  <div className={styles.stepHeader}>
                                    <ListOrdered size={14} />
                                    <span>Step-by-Step Derivation & Solution</span>
                                  </div>
                                  <div
                                    className={styles.stepContent}
                                    dangerouslySetInnerHTML={{
                                      __html: renderCleanMarkdown(sections.solution),
                                    }}
                                  />
                                </div>
                              )}

                              {/* 4. Final Answer */}
                              {sections.finalAnswer && (
                                <div className={styles.finalAnswerCard}>
                                  <div className={styles.finalAnswerHeader}>
                                    <div className={styles.finalAnswerLabel}>
                                      <CheckCircle2 size={14} />
                                      <span>Final Answer</span>
                                    </div>
                                    <button
                                      className={styles.cardActionBtn}
                                      onClick={() => copyToClipboard(sections.finalAnswer!, `ans_${msg.id}`)}
                                      title="Copy Result"
                                    >
                                      {copiedId === `ans_${msg.id}` ? (
                                        <>
                                          <Check size={11} />
                                          <span>Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={11} />
                                          <span>Copy Result</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <div
                                    className={styles.finalAnswerBody}
                                    dangerouslySetInnerHTML={{
                                      __html: renderCleanMarkdown(sections.finalAnswer),
                                    }}
                                  />
                                </div>
                              )}

                              {/* 5. Key Takeaway */}
                              {sections.takeaway && (
                                <div className={styles.takeawayCard}>
                                  <div className={styles.takeawayHeader}>
                                    <Compass size={13} />
                                    <span>Exam Technique & Key Takeaway</span>
                                  </div>
                                  <div
                                    className={styles.markdownBody}
                                    dangerouslySetInnerHTML={{
                                      __html: renderCleanMarkdown(sections.takeaway),
                                    }}
                                  />
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {/* Smart Follow-Up Chips */}
                        <div className={styles.followUpSection}>
                          <span className={styles.followUpLabel}>Follow-up:</span>
                          <button
                            className={styles.followUpChip}
                            onClick={() =>
                              sendMessage('Explain this concept in simpler terms with an intuitive real-life example.')
                            }
                          >
                            <SlidersHorizontal size={11} />
                            <span>Simplify Explanation</span>
                          </button>
                          <button
                            className={styles.followUpChip}
                            onClick={() =>
                              sendMessage('Provide a related practice question with complete numerical solution.')
                            }
                          >
                            <HelpCircle size={11} />
                            <span>Practice Problem</span>
                          </button>
                          <button
                            className={styles.followUpChip}
                            onClick={() =>
                              sendMessage('What are the most common exam traps or mistakes students make in this topic?')
                            }
                          >
                            <Compass size={11} />
                            <span>Common Exam Traps</span>
                          </button>
                          <button
                            className={styles.followUpChip}
                            onClick={() =>
                              sendMessage('Explain this entire derivation in Hinglish with simple terms.')
                            }
                          >
                            <BookOpen size={11} />
                            <span>Explain in Hinglish</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Real-Time Streaming Card */}
              {isStreaming && (
                <div className={styles.aiRow}>
                  <div className={styles.aiResponseCard}>
                    <div className={styles.aiCardHeader}>
                      <div className={styles.aiCardHeaderLeft}>
                        <Sparkles size={13} color="var(--ai-accent)" />
                        <span>Formulating Solution...</span>
                      </div>
                    </div>
                    <div className={styles.aiCardBody}>
                      {streamingContent ? (
                        <div
                          className={styles.markdownBody}
                          dangerouslySetInnerHTML={{
                            __html:
                              renderCleanMarkdown(streamingContent) +
                              `<span class="${styles.typingCursor}"></span>`,
                          }}
                        />
                      ) : (
                        <div className={styles.thinkingBar}>
                          <div className={styles.thinkingPulse}>
                            <span />
                            <span />
                            <span />
                          </div>
                          <span className={styles.thinkingText}>
                            Analyzing problem and formulating step-by-step solution...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className={styles.errorCard}>
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* ==========================================================
            INPUT CONSOLE (CLEAN & INTEGRATED)
            ========================================================== */}
        <div className={styles.inputContainer}>
          <div className={styles.inputCard}>
            {isListening && (
              <div className={styles.listeningNotice}>
                <span className={styles.listeningDot} />
                <span>Listening... Speak clearly. Tap mic or Send when done.</span>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={isListening ? 'Listening to speech... speak your question' : 'Ask any doubt, equation, or concept...'}
              className={styles.inputTextarea}
              rows={1}
              disabled={isStreaming}
            />

            <div className={styles.inputBottomBar}>
              <div className={styles.inputPillsRow}>
                <button
                  type="button"
                  className={styles.inlineSelectBtn}
                  onClick={() => setShowSettings(v => !v)}
                  title="Configure Exam & Level"
                >
                  <SlidersHorizontal size={11} />
                  <span>{examType}</span>
                  <span>•</span>
                  <span>{difficulty === 'standard' ? 'Standard' : difficulty === 'advanced' ? 'Advanced' : 'Basic'}</span>
                </button>

                {subject && (
                  <span className={styles.inlineSelectBtn}>
                    {subject}
                  </span>
                )}
              </div>

              <div className={styles.inputActionsRight}>
                <button
                  type="button"
                  className={`${styles.micButton} ${isListening ? styles.micActive : ''}`}
                  onClick={startListening}
                  title="Voice Input"
                >
                  <Mic size={15} />
                </button>

                {isStreaming ? (
                  <button onClick={stopGeneration} className={styles.stopButton}>
                    <Square size={12} />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isStreaming}
                    className={styles.submitBtn}
                    title="Send"
                  >
                    <Send size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.inputFooter}>
            AI responses should be verified against textbook curricula.
          </div>
        </div>
      </main>
    </div>
  );
}
