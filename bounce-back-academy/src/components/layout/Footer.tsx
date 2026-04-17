import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      padding: '3rem 2rem',
      background: 'var(--surface)',
      borderTop: '1px solid var(--surface-border)',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }} className="text-gradient">Bounce Back Academy</h3>
          <p style={{ opacity: 0.8, maxWidth: '300px' }}>
            Providing high-quality free study material for NBSE Classes 8 to 12.
          </p>
        </div>
        
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><Link href="/papers" className="nav-link">Question Papers</Link></li>
            <li><Link href="/notes" className="nav-link">Notes</Link></li>
            <li><Link href="/videos" className="nav-link">Videos</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Support</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><Link href="/contact" className="nav-link">Contact Us</Link></li>
            <li><Link href="/feedback" className="nav-link">Feedback</Link></li>
            <li><Link href="/admin/login" className="nav-link">Admin Login</Link></li>
          </ul>
        </div>
      </div>
      
      <div style={{
        textAlign: 'center',
        marginTop: '3rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--surface-border)',
        opacity: 0.6,
        fontSize: '0.875rem'
      }}>
        © {new Date().getFullYear()} Bounce Back Academy. All rights reserved.
      </div>
    </footer>
  );
}
