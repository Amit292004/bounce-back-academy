export interface FaqItem {
  id: string;
  category: FaqCategoryId;
  q: string;
  a: string;
  keywords?: string[];
}

export type FaqCategoryId =
  | 'getting-started'
  | 'courses'
  | 'study-materials'
  | 'exams'
  | 'ai-tutor'
  | 'payments'
  | 'account-support'
  | 'quizzes';

export interface FaqCategory {
  id: FaqCategoryId;
  label: string;
  shortLabel?: string;
  description: string;
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    description: 'Platform access, account creation, and navigation',
  },
  {
    id: 'courses',
    label: 'Courses & Enrollment',
    shortLabel: 'Courses',
    description: 'Course details, enrollment, pricing, and access',
  },
  {
    id: 'study-materials',
    label: 'Study Materials',
    shortLabel: 'Materials',
    description: 'Notes, previous-year papers, syllabus coverage, and downloads',
  },
  {
    id: 'exams',
    label: 'Exams & Preparation',
    shortLabel: 'Exams',
    description: 'NBSE, JEE Main, JEE Advanced, NEET UG, and CUET',
  },
  {
    id: 'ai-tutor',
    label: 'AI Tutor',
    description: 'Supported subjects, question explanations, and feature availability',
  },
  {
    id: 'payments',
    label: 'Payments & Orders',
    shortLabel: 'Payments',
    description: 'Cart, checkout, payment confirmation, and purchased courses',
  },
  {
    id: 'account-support',
    label: 'Account & Support',
    shortLabel: 'Account',
    description: 'Login issues, profile settings, and troubleshooting',
  },
  {
    id: 'quizzes',
    label: 'Quizzes & Assessments',
    shortLabel: 'Quizzes',
    description: 'Timed MCQ tests, negative marking, scoring, and reviews',
  },
];

export const FAQS: FaqItem[] = [
  // ── 1. Getting Started ──
  {
    id: 'gs-start',
    category: 'getting-started',
    q: 'How do I get started with Bounce Back Academy?',
    a: 'You can explore free chapter notes, past exam papers, and syllabus resources directly in your browser without creating an account. When you are ready to track quiz performance, bookmark favorites, or enroll in practical skill courses, click Sign In or Register to set up your free student account.',
    keywords: ['start', 'begin', 'register', 'signup', 'account', 'free account', 'getting started', 'new user'],
  },
  {
    id: 'gs-mobile',
    category: 'getting-started',
    q: 'Can I access my study materials on mobile devices?',
    a: 'Yes. Bounce Back Academy is fully responsive and optimized for smartphones, tablets, and laptops. You can read PDF revision notes in the native browser viewer, watch video lectures, and practice quizzes smoothly on any screen without installing additional apps.',
    keywords: ['mobile', 'phone', 'android', 'iphone', 'ios', 'tablet', 'ipad', 'responsive', 'devices'],
  },
  {
    id: 'gs-navigate',
    category: 'getting-started',
    q: 'How do I switch between different school classes and exam tracks?',
    a: 'Use the Class Switcher located in the top navigation bar to select your class (Classes 8 through 12). For competitive entrance examinations, click Courses or Competitive Exams in the menu to access targeted preparation resources for JEE, NEET, and CUET.',
    keywords: ['navigation', 'class switcher', 'switch class', 'classes', 'nbse', 'menu', 'tracks', 'curriculum'],
  },

  // ── 2. Courses & Enrollment ──
  {
    id: 'cr-enroll',
    category: 'courses',
    q: 'How can I enroll in a course or skill track?',
    a: 'Browse our course catalog under the Courses page or Premium Store, choose your desired track, and click "Add to Cart". Review your items in the cart drawer and proceed to our secure checkout. Once payment is confirmed, your course unlocks immediately.',
    keywords: ['enroll', 'enrollment', 'buy', 'purchase', 'add to cart', 'cart', 'checkout', 'pricing', 'store'],
  },
  {
    id: 'cr-access',
    category: 'courses',
    q: 'How do I access a course after purchasing it?',
    a: 'Log into your account and open your Student Profile from the top navigation. Under the "My Courses" tab, you will find all your active enrolled courses with instant access to video lessons, practical assignments, and study attachments.',
    keywords: ['access', 'purchased course', 'profile', 'my courses', 'dashboard', 'unlocked', 'where are courses'],
  },
  {
    id: 'cr-skills',
    category: 'courses',
    q: 'What is included in the Practical Skill courses?',
    a: 'Beyond textbook curricula, our practical skill catalog provides hands-on training in Artificial Intelligence tools (such as ChatGPT, Midjourney, and prompt engineering), programming fundamentals, and modern web development. Each course includes lifetime access with verified practical exercises.',
    keywords: ['practical skills', 'skill development', 'coding', 'programming', 'ai tools', 'web development', 'career'],
  },

  // ── 3. Study Materials ──
  {
    id: 'sm-free',
    category: 'study-materials',
    q: 'Are study notes and previous-year question papers free?',
    a: 'Yes. All standard chapter revision notes and previous-year question papers (from 2016 onwards) can be viewed and read directly in your browser completely free of charge. Registered students can also download offline PDF copies for revision anytime.',
    keywords: ['free', 'cost', 'charge', 'study notes', 'revision notes', 'question papers', 'past papers', 'download', 'pdf'],
  },
  {
    id: 'sm-boards',
    category: 'study-materials',
    q: 'Which school boards and classes does Bounce Back Academy support?',
    a: 'Bounce Back Academy primarily caters to the Nagaland Board of School Education (NBSE) curriculum for Classes 8, 9, 10, 11, and 12, with syllabus coverage mapped to standard NCERT academic guidelines.',
    keywords: ['nbse', 'nagaland', 'board', 'classes', 'class 8', 'class 9', 'class 10', 'class 11', 'class 12', 'ncert'],
  },
  {
    id: 'sm-chapters',
    category: 'study-materials',
    q: 'How do I find notes and question papers for a specific chapter?',
    a: 'Visit the Universal Library or navigate directly to your class (e.g., Class 10 or Class 12). From there, filter by your subject (Mathematics, Science, Social Science, English) to access structured chapter summaries, formulas, and past board papers.',
    keywords: ['find notes', 'search notes', 'chapter', 'library', 'subject', 'maths', 'science', 'english', 'question bank'],
  },

  // ── 4. Exams & Preparation ──
  {
    id: 'ex-covered',
    category: 'exams',
    q: 'Which competitive entrance examinations are covered?',
    a: 'We support major national entrance examinations including JEE Main, JEE Advanced, NEET UG, and CUET with high-yield chapter notes, formula sheets, mock assessments, and strategic exam guides.',
    keywords: ['jee', 'jee main', 'jee advanced', 'neet', 'neet ug', 'cuet', 'competitive exams', 'entrance tests'],
  },
  {
    id: 'ex-resources',
    category: 'exams',
    q: 'What study resources are provided for competitive exam preparation?',
    a: 'We provide comprehensive formula cheat sheets, high-yield chapter summaries, previous entrance question papers, and topic-wise revision modules for national tests including JEE Main, JEE Advanced, NEET UG, and CUET.',
    keywords: ['resources', 'formula sheet', 'exam resources', 'revision notes', 'entrance study', 'jee notes', 'neet notes'],
  },
  {
    id: 'ex-player',
    category: 'exams',
    q: 'What is the PW Video Player and how does it help studying?',
    a: 'The PW Video Player is our custom lecture experience built specifically for distraction-free learning. It offers precise slower and faster playback speed steppers (0.25x to 3.0x), custom quality selection, timeline chapter markers, screen locking to prevent accidental touches while writing notes, and downloadable lecture notes.',
    keywords: ['pw video player', 'video player', 'lectures', 'playback speed', 'timeline', 'screen lock', 'distraction free'],
  },

  // ── 5. AI Tutor ──
  {
    id: 'ai-work',
    category: 'ai-tutor',
    q: 'How does the Bounce Back AI Tutor work?',
    a: 'The AI Tutor is an academic assistant powered by state-of-the-art Groq Cloud AI. It is calibrated specifically for CBSE, NBSE, JEE, and NEET syllabus questions, providing step-by-step mathematical derivations, physical intuitions, and verified solutions.',
    keywords: ['ai tutor', 'ai', 'doubt solver', 'groq', 'derivations', 'explanations', 'homework help', 'step by step'],
  },
  {
    id: 'ai-subjects',
    category: 'ai-tutor',
    q: 'Which subjects and languages are supported by the AI Tutor?',
    a: 'You can ask questions across Mathematics, Physics, Chemistry, and Biology. Formulas are rendered cleanly with LaTeX KaTeX notation, and you can interact in either English or Hinglish depending on your learning preference.',
    keywords: ['subjects', 'math', 'physics', 'chemistry', 'biology', 'hinglish', 'english', 'katex', 'latex', 'formulas'],
  },
  {
    id: 'ai-availability',
    category: 'ai-tutor',
    q: 'Is the AI Tutor available around the clock?',
    a: 'Yes. The AI Tutor is available 24/7. You can access it anytime from the top navigation bar or the floating AI button to get instant explanations whenever you are solving problems late at night or preparing right before exams.',
    keywords: ['24/7', 'availability', 'timing', 'floating button', 'always open', 'night study', 'instant'],
  },

  // ── 6. Payments & Orders ──
  {
    id: 'pm-methods',
    category: 'payments',
    q: 'What payment methods are accepted during checkout?',
    a: 'Checkout supports all major Indian payment methods through our secure gateway, including UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking, Debit/Credit Cards (Visa, Mastercard, RuPay), and popular digital wallets.',
    keywords: ['payment methods', 'upi', 'gpay', 'phonepe', 'paytm', 'bhim', 'net banking', 'credit card', 'debit card'],
  },
  {
    id: 'pm-issue',
    category: 'payments',
    q: 'What should I do if my payment succeeds but the course is not unlocked?',
    a: 'Course access is normally unlocked immediately after payment confirmation. If your course does not appear in your Profile within 15 minutes, please email bouncebackacademy.edu@gmail.com or message us on WhatsApp at +91 7628024274 with your order ID, and our team will verify and activate it promptly.',
    keywords: ['payment issue', 'payment failed', 'unlocked', 'pending', 'course not showing', 'transaction id', 'refund'],
  },
  {
    id: 'pm-history',
    category: 'payments',
    q: 'Where can I view my purchase receipts and order details?',
    a: 'You can view your enrolled courses, transaction status, and order history anytime by visiting your Student Profile dashboard under the Orders / Purchased section.',
    keywords: ['receipt', 'invoice', 'order details', 'purchase history', 'transactions', 'orders'],
  },

  // ── 7. Account & Technical Support ──
  {
    id: 'as-password',
    category: 'account-support',
    q: 'How do I reset my password if I forget it?',
    a: 'Visit the Sign In page, click "Forgot Password?", and enter your registered email address. You will receive a secure verification link to create a new password and regain access to your student account.',
    keywords: ['forgot password', 'reset password', 'cannot login', 'login issue', 'change password', 'sign in'],
  },
  {
    id: 'as-profile',
    category: 'account-support',
    q: 'How do I update my profile details and selected class?',
    a: 'Once signed in, open your Student Profile to update your name, email preferences, and account settings. You can also switch your active class anytime using the class switcher in the top navigation bar.',
    keywords: ['update profile', 'edit name', 'change email', 'change class', 'settings', 'account details'],
  },
  {
    id: 'as-contact',
    category: 'account-support',
    q: 'How can I reach the Bounce Back Academy support team?',
    a: 'You can reach out anytime through our Contact Us page (/contact), email bouncebackacademy.edu@gmail.com, or message founder Amit Sharma directly on WhatsApp at +91 7628024274. We are committed to assisting every student promptly.',
    keywords: ['contact support', 'support team', 'reach us', 'whatsapp', 'email support', 'phone number', 'help desk'],
  },

  // ── 8. Quizzes & Assessments ──
  {
    id: 'qz-interactive',
    category: 'quizzes',
    q: 'How do interactive chapter quizzes and mock assessments work?',
    a: 'You can practice chapter-wise and full-length timed MCQ quizzes. The platform tracks your elapsed time, records your answer submissions, and calculates your performance score immediately upon completion.',
    keywords: ['quiz', 'test', 'mock test', 'mcq', 'timed quiz', 'assessments', 'practice questions', 'scoring'],
  },
  {
    id: 'qz-marking',
    category: 'quizzes',
    q: 'Does the quiz system support negative marking and answer reviews?',
    a: 'Yes. Competitive entrance quizzes (such as JEE and NEET prep) feature calibrated negative marking (-1 for incorrect answers) and provide instant solution breakdowns so you can review mistakes immediately.',
    keywords: ['negative marking', 'marking scheme', 'answer review', 'solutions', 'score', 'grading', 'jee neet quiz'],
  },
  {
    id: 'qz-retake',
    category: 'quizzes',
    q: 'Can I review my past quiz attempts and retake tests for practice?',
    a: 'Yes. You can view your detailed scorecard, identify conceptual mistakes, and re-attempt any quiz anytime from the Quiz portal to master weak topics before your board and entrance exams.',
    keywords: ['retake quiz', 'reattempt', 'scorecard', 'review mistakes', 'quiz portal', 'practice again'],
  },
];

export const FAQ_ITEMS = FAQS;
