"use client";

import Image from 'next/image';
import { FaPhoneAlt, FaEnvelope, FaWhatsapp, FaInstagram, FaTelegramPlane, FaYoutube, FaLinkedin } from 'react-icons/fa';
import styles from './page.module.css';

export default function ContactPage() {
  const socialLinks = [
    { name: 'WhatsApp', url: 'https://wa.me/917628024274', icon: <FaWhatsapp />, color: '#25D366' },
    { name: 'Instagram', url: 'https://www.instagram.com/am____it_292004/', icon: <FaInstagram />, color: '#E1306C' },
    { name: 'Telegram', url: 'https://t.me/amit292004', icon: <FaTelegramPlane />, color: '#0088cc' },
    { name: 'YouTube', url: 'https://www.youtube.com/@BounceBackAcademy', icon: <FaYoutube />, color: '#FF0000' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/amit-sharma-142a26359/', icon: <FaLinkedin />, color: '#0077b5' },
  ];

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div style={{ 
        padding: '5rem 2rem 4rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.875rem', marginBottom: '1.5rem', backdropFilter: 'blur(10px)' }}>
          <FaEnvelope /> Get in Touch
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Contact <span className="text-gradient">Us</span>
        </h1>
        <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>We&apos;d love to hear from you</p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        <div className={styles.grid}>
          
          {/* Left Column: Admin Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', background: 'var(--surface)' }}>
              {/* Profile Image & Name */}
              <div style={{ marginBottom: '2rem' }}>
                <div className={styles.profileImage} style={{ 
                  width: '100px', height: '100px', borderRadius: 'var(--radius-md)', 
                  background: '#f59e0b', overflow: 'hidden', marginBottom: '1rem',
                  border: '2px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}>
                  <Image 
                    src="/amit-sharma.jpg" 
                    alt="Amit Sharma" 
                    width={100} 
                    height={100} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.2rem' }}>Amit Sharma</h2>
                <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Founder, Bounce Back Academy</p>
              </div>

              {/* Contact Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.contactPill} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                  <FaPhoneAlt style={{ color: '#6366f1' }} />
                  <span style={{ fontWeight: 500 }}>7628024274</span>
                </div>
                <div className={styles.contactPill} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                  <FaEnvelope style={{ color: '#8b5cf6' }} />
                  <span style={{ fontWeight: 500 }}>amitsharma72020@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Note Card */}
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                📚 Online Classes available only for <span style={{ color: '#3b82f6', fontWeight: 700 }}>Maths</span> and <span style={{ color: '#6366f1', fontWeight: 700 }}>Science</span> subjects.
              </p>
            </div>
          </div>

          {/* Right Column: Social Links */}
          <div style={{ paddingTop: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Connect With Us</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {socialLinks.map((link, i) => (
                <a 
                  key={i} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`glass-panel ${styles.socialCard}`}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '1.25rem', 
                    padding: '1.25rem 1.5rem', background: 'var(--surface)',
                    textDecoration: 'none', color: 'inherit',
                    '--hover-color': link.color
                  } as React.CSSProperties}
                >
                  <div className={styles.socialIcon} style={{ 
                    width: '45px', height: '45px', borderRadius: '50%', 
                    background: `rgba(255,255,255,0.05)`, display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                    color: link.color
                  }}>
                    {link.icon}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{link.name}</h4>
                    <p style={{ opacity: 0.5, fontSize: '0.8rem', wordBreak: 'break-all' }}>{link.url}</p>
                  </div>
                </a>
              ))}

              {/* Subscribe Banner */}
              <div className="glass-panel" style={{ 
                marginTop: '1rem',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 100%)',
                border: '1px solid rgba(99,102,241,0.3)',
                padding: '2rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                  📌 Subscribe to Bounce Back Academy
                </h3>
                <a 
                  href="https://www.youtube.com/@BounceBackAcademy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary" 
                  style={{ 
                    padding: '0.75rem 2rem', 
                    display: 'inline-block',
                    textDecoration: 'none'
                  }}
                >
                  Subscribe Now &rarr;
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
