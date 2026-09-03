import { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use for Bounce Back Academy. Read the terms and conditions for using our platform.',
};

export default function TermsOfUsePage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Terms of Use</h1>
        <p className={styles.lastUpdated}>Last updated: September 3, 2026</p>
      </div>

      <div className={styles.contentCard}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Agreement to Terms</h2>
          <p className={styles.text}>
            By accessing or using <strong>Bounce Back Academy</strong> (&quot;the Platform&quot;), you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to all of these terms, you may not access or use our services.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Use of Educational Resources</h2>
          <p className={styles.text}>
            Bounce Back Academy provides question papers, study notes, video lectures, AI doubt assistance, and quiz materials for educational purposes only.
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Materials are provided for individual student learning and self-study.</li>
            <li className={styles.listItem}>You may not redistribute, re-sell, or alter our proprietary study materials for commercial gain without explicit written authorization.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. User Accounts & Responsibilities</h2>
          <p className={styles.text}>
            When creating an account on Bounce Back Academy:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li className={styles.listItem}>You agree to provide accurate and truthful account registration information.</li>
            <li className={styles.listItem}>Abusive, offensive, or fraudulent activity on discussion forums or AI tools will result in account suspension.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Intellectual Property</h2>
          <p className={styles.text}>
            All branding, graphics, original study notes, logos, and software design elements on this platform are owned by or licensed to Bounce Back Academy. All rights reserved.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Premium Purchases & Subscriptions</h2>
          <p className={styles.text}>
            Access to paid notes, premium question banks, or specialized courses through our Premium Store is subject to confirmed payment. Digital goods access is non-transferable.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Contact Information</h2>
          <p className={styles.text}>
            For any questions regarding these Terms of Use, please reach out to us at{' '}
            <a href="mailto:bouncebackacademy.edu@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              bouncebackacademy.edu@gmail.com
            </a>{' '}
            or via our <Link href="/contact" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Contact Form</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
