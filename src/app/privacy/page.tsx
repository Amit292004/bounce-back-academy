import { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Bounce Back Academy. Read how we protect and manage your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last updated: September 3, 2026</p>
      </div>

      <div className={styles.contentCard}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Introduction</h2>
          <p className={styles.text}>
            Welcome to <strong>Bounce Back Academy</strong> (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
          <p className={styles.text}>
            We collect personal information that you voluntarily provide to us when registering for an account, accessing study materials, participating in quizzes, or contacting us.
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Account Information:</strong> Name, email address, phone number, and class/grade details.</li>
            <li className={styles.listItem}><strong>Usage Data:</strong> Pages visited, quiz scores, bookmarked study notes, and interaction with AI learning tools.</li>
            <li className={styles.listItem}><strong>Device & Diagnostic Data:</strong> IP address, browser type, and device identifiers to optimize website performance.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
          <p className={styles.text}>
            We use the information we collect to:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Provide, maintain, and improve our educational resources and features.</li>
            <li className={styles.listItem}>Track learning progress, test performance, and saved favorites.</li>
            <li className={styles.listItem}>Send important notifications regarding course updates and announcements.</li>
            <li className={styles.listItem}>Respond to user support inquiries and feedback.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Data Security & Sharing</h2>
          <p className={styles.text}>
            Your privacy is paramount. We do not sell, rent, or trade your personal information with third parties. We implement technical and administrative security measures to protect your data against unauthorized access, loss, or alteration.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Cookies and Tracking Technologies</h2>
          <p className={styles.text}>
            We use cookies and session storage to remember your preferences (such as selected class grade and theme settings) and keep you authenticated securely.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Contact Us</h2>
          <p className={styles.text}>
            If you have questions or concerns about this Privacy Policy or your data, please contact us at{' '}
            <a href="mailto:bouncebackacademy.edu@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              bouncebackacademy.edu@gmail.com
            </a>{' '}
            or visit our <Link href="/contact" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Contact Page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
