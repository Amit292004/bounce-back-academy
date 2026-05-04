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

          <div className={styles.profileCard}>
            <div className={styles.profileImageContainer}>
              <Image
                src="/amit-sharma.jpg"
                alt="Amit Sharma"
                width={120}
                height={120}
                className={styles.profileImage}
              />
            </div>
            <h2 className={styles.profileName}>Amit Sharma</h2>
            <p className={styles.profileRole}>Founder, Bounce Back Academy</p>

            <div className={styles.contactDetails}>
              <a href="tel:7628024274" className={styles.contactPill}>
                <FaPhoneAlt className={styles.phoneIcon} />
                <span>7628024274</span>
              </a>
              <a href="mailto:bouncebackacademy.edu@gmail.com" className={styles.contactPill}>
                <FaEnvelope className={styles.emailIcon} />
                <span>bouncebackacademy.edu@gmail.com</span>
              </a>
            </div>
          </div>

          <div className={styles.noteBanner}>
            <p>
              📚 Online Classes available only for <span className={styles.highlightBlue}>Maths</span> and <span className={styles.highlightPurple}>Science</span> subjects.
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

          <div className={styles.subscribeBox}>
            <h3 className={styles.subscribeTitle}>
              📌 Subscribe to Bounce Back Academy
            </h3>
            <a
              href="https://www.youtube.com/@BounceBackAcademy"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.subscribeBtn}
            >
              Subscribe Now &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
