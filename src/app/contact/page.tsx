"use client";

import Image from 'next/image';
import { FaPhoneAlt, FaEnvelope, FaWhatsapp, FaInstagram, FaTelegramPlane, FaYoutube, FaLinkedin } from 'react-icons/fa';
import styles from './page.module.css';

export default function ContactPage() {
  const socialLinks = [
    { name: 'WhatsApp', url: 'https://wa.me/917628024274', icon: <FaWhatsapp />, color: '#25D366' },
    { name: 'Instagram', url: 'https://www.instagram.com/bouncebackacdemy', icon: <FaInstagram />, color: '#E1306C' },
    { name: 'Telegram', url: 'https://t.me/amit292004', icon: <FaTelegramPlane />, color: '#0088cc' },
    { name: 'YouTube', url: 'https://www.youtube.com/@BounceBackAcademy', icon: <FaYoutube />, color: '#FF0000' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/amit-sharma-142a26359/', icon: <FaLinkedin />, color: '#0077b5' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* SECTION 1: CONTACT US (From Image 2) */}
        <div className={styles.section}>
          <div className={styles.headerSection}>
            <div className={styles.getInTouchBadge}>
              <FaEnvelope /> Get in Touch
            </div>
            <h1 className={styles.mainTitle}>
              Contact <span className="text-gradient">Us</span>
            </h1>
            <p className={styles.subtitle}>We&apos;d love to hear from you</p>
          </div>

          <div className={styles.profileCard} itemScope itemType="https://schema.org/Person">
            <div className={styles.profileImageContainer}>
              <div className={styles.profileImageInner}>
                <Image
                  src="/amit-sharma.jpg"
                  alt="Amit Sharma - Founder, Bounce Back Academy"
                  width={120}
                  height={120}
                  className={styles.profileImage}
                  itemProp="image"
                  priority
                />
              </div>
            </div>
            <h2 className={styles.profileName} itemProp="name">Amit Sharma</h2>
            <p className={styles.profileRole} itemProp="jobTitle">Founder, Bounce Back Academy</p>

            <div className={styles.contactDetails}>
              <a href="tel:7628024274" className={styles.contactPill} itemProp="telephone">
                <FaPhoneAlt className={styles.phoneIcon} />
                <span>7628024274</span>
              </a>
              <a href="mailto:bouncebackacademy.edu@gmail.com" className={styles.contactPill} itemProp="email">
                <FaEnvelope className={styles.emailIcon} />
                <span>bouncebackacademy.edu@gmail.com</span>
              </a>
            </div>
          </div>

          <div className={styles.noteBanner}>
            <p>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:'6px',flexShrink:0}}>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>Online Classes available only for <span className={styles.highlightBlue}>Maths</span> and <span className={styles.highlightPurple}>Science</span> subjects.
            </p>
          </div>
        </div>

        {/* SECTION 2: CONNECT WITH US (From Image 1) */}
        <div className={styles.section}>
          <h3 className={styles.connectTitle}>Connect With Us</h3>

          <div className={styles.socialList}>
            {socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialItem}
              >
                <div className={styles.socialIconWrapper} style={{ backgroundColor: `${link.color}20` }}>
                  <span style={{ color: link.color }}>{link.icon}</span>
                </div>
                <span className={styles.socialName}>{link.name}</span>
              </a>
            ))}
          </div>

        </div>

        {/* SECTION 3: FAQ & QUICK INFO FOR SEARCH ENGINES */}
        <div className={styles.section}>
          <h3 className={styles.connectTitle}>Frequently Asked Questions</h3>
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>Who is the founder of Bounce Back Academy?</h4>
              <p className={styles.faqAnswer}>
                <strong>Amit Sharma</strong> is the Founder and Educator at Bounce Back Academy, delivering specialized NBSE coaching and study material for Classes 8 to 12.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>What is the contact number of Amit Sharma (Founder)?</h4>
              <p className={styles.faqAnswer}>
                You can call or WhatsApp Amit Sharma directly at <a href="tel:7628024274" className={styles.textLink}>+91 7628024274</a> for inquiries and admissions.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>What is the official email address?</h4>
              <p className={styles.faqAnswer}>
                You can email us at <a href="mailto:bouncebackacademy.edu@gmail.com" className={styles.textLink}>bouncebackacademy.edu@gmail.com</a>.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>What classes and subjects are taught?</h4>
              <p className={styles.faqAnswer}>
                Online classes are conducted for <strong>Maths</strong> and <strong>Science</strong> for NBSE Classes 8, 9, 10, 11, and 12, along with exam preparation for JEE, NEET, and CUET.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
