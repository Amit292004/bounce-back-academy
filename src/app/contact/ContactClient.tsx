"use client";

import Image from 'next/image';
import { FaPhoneAlt, FaEnvelope, FaWhatsapp, FaInstagram, FaTelegramPlane, FaYoutube, FaLinkedin } from 'react-icons/fa';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import styles from './page.module.css';

export default function ContactClient() {
  const socialLinks = [
    { name: 'WhatsApp', desc: 'Direct chat for admissions & queries', url: 'https://wa.me/917628024274', icon: <FaWhatsapp />, color: '#25D366' },
    { name: 'Instagram', desc: 'Study motivation & exam updates', url: 'https://www.instagram.com/bouncebackacdemy', icon: <FaInstagram />, color: '#E1306C' },
    { name: 'Telegram', desc: 'Quick notes & direct updates', url: 'https://t.me/amit292004', icon: <FaTelegramPlane />, color: '#0088cc' },
    { name: 'YouTube', desc: 'Free video lectures & NBSE tips', url: 'https://www.youtube.com/@BounceBackAcademy', icon: <FaYoutube />, color: '#FF0000' },
    { name: 'LinkedIn', desc: 'Connect with Amit Sharma', url: 'https://www.linkedin.com/in/amit-sharma-142a26359/', icon: <FaLinkedin />, color: '#0077b5' },
  ];

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Get in Touch</span>
        </div>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>
          We&apos;d love to hear from you. Reach out directly for NBSE coaching inquiries, study resources, or support.
        </p>
      </div>

      {/* Top Two-Column Grid */}
      <div className={styles.topGrid}>
        {/* Left Column: Founder Profile & Note */}
        <div className={styles.leftCol}>
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
            <div className={styles.noteIcon}>
              <BookOpen size={17} />
            </div>
            <p style={{ margin: 0 }}>
              Online Classes available only for <span className={styles.highlightSubject}>Maths</span> and <span className={styles.highlightSubject}>Science</span> subjects.
            </p>
          </div>
        </div>

        {/* Right Column: Connect With Us */}
        <div className={styles.rightCol}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Connect With Us</h3>
              <p className={styles.panelSub}>Follow our official channels or message us directly.</p>
            </div>

            <div className={styles.socialList}>
              {socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialItem}
                >
                  <div className={styles.socialIconWrapper} style={{ color: link.color }}>
                    {link.icon}
                  </div>
                  <div className={styles.socialInfo}>
                    <span className={styles.socialName}>{link.name}</span>
                    <span className={styles.socialHandle}>{link.desc}</span>
                  </div>
                  <ArrowUpRight size={16} className={styles.socialArrow} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.sep} />

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.sectionHead}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            <span>Quick Answers</span>
          </div>
          <h3 className={styles.sectionTitle}>Frequently Asked Questions</h3>
          <p className={styles.sectionSub}>Common details about admissions, classes, and reaching our team.</p>
        </div>

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
      </section>
    </div>
  );
}
