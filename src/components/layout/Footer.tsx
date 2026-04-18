import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.section}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }} className="text-gradient">Bounce Back Academy</h3>
          <p style={{ opacity: 0.8, maxWidth: '300px' }}>
            Providing high-quality free study material for NBSE Classes 8 to 12.
          </p>
        </div>
        
        <div className={styles.section}>
          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><Link href="/papers" className="nav-link">Question Papers</Link></li>
            <li><Link href="/notes" className="nav-link">Notes</Link></li>
            <li><Link href="/videos" className="nav-link">Videos</Link></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Support</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><Link href="/contact" className="nav-link">Contact Us</Link></li>
            <li><Link href="/feedback" className="nav-link">Feedback</Link></li>
            <li><Link href="/admin/login" className="nav-link">Admin Login</Link></li>
          </ul>
        </div>
      </div>
      
      <div className={styles.bottom}>
        © {new Date().getFullYear()} Bounce Back Academy. All rights reserved.
      </div>
    </footer>
  );
}
