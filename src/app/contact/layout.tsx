import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Amit Sharma (Founder) – Contact Bounce Back Academy',
  description:
    'Contact Amit Sharma, Founder of Bounce Back Academy. Phone: +91 7628024274, Email: bouncebackacademy.edu@gmail.com. Online NBSE classes for Class 8–12 Maths and Science.',
  keywords: [
    'Amit Sharma',
    'Amit Sharma Founder',
    'Founder Bounce Back Academy',
    'Bounce Back Academy Founder',
    'Amit Sharma contact',
    'Amit Sharma phone number',
    '7628024274',
    'bouncebackacademy.edu@gmail.com',
    'Bounce Back Academy contact details',
    'NBSE tuition Nagaland',
  ],
  alternates: {
    canonical: 'https://bouncebackacademy.vercel.app/contact',
  },
  openGraph: {
    title: 'Amit Sharma – Founder, Bounce Back Academy | Contact Details',
    description:
      'Contact Amit Sharma, Founder of Bounce Back Academy. Call/WhatsApp: +91 7628024274 | Email: bouncebackacademy.edu@gmail.com',
    url: 'https://bouncebackacademy.vercel.app/contact',
    siteName: 'Bounce Back Academy',
    images: [
      {
        url: 'https://bouncebackacademy.vercel.app/amit-sharma.jpg',
        width: 600,
        height: 600,
        alt: 'Amit Sharma - Founder, Bounce Back Academy',
      },
    ],
    locale: 'en_IN',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amit Sharma – Founder, Bounce Back Academy',
    description:
      'Contact Founder Amit Sharma: Call/WhatsApp +91 7628024274, Email: bouncebackacademy.edu@gmail.com',
    images: ['https://bouncebackacademy.vercel.app/amit-sharma.jpg'],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contactJsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      '@id': 'https://bouncebackacademy.vercel.app/contact#webpage',
      url: 'https://bouncebackacademy.vercel.app/contact',
      name: 'Contact Amit Sharma - Founder, Bounce Back Academy',
      description:
        'Official contact information for Amit Sharma, founder of Bounce Back Academy.',
      mainEntity: {
        '@type': 'Person',
        '@id': 'https://bouncebackacademy.vercel.app/#founder',
        name: 'Amit Sharma',
        jobTitle: 'Founder & Educator',
        image: 'https://bouncebackacademy.vercel.app/amit-sharma.jpg',
        telephone: '+91-7628024274',
        email: 'bouncebackacademy.edu@gmail.com',
        url: 'https://bouncebackacademy.vercel.app/contact',
        worksFor: {
          '@type': 'EducationalOrganization',
          '@id': 'https://bouncebackacademy.vercel.app/#organization',
          name: 'Bounce Back Academy',
          url: 'https://bouncebackacademy.vercel.app',
        },
        sameAs: [
          'https://wa.me/917628024274',
          'https://www.instagram.com/bouncebackacdemy',
          'https://www.youtube.com/@BounceBackAcademy',
          'https://www.linkedin.com/in/amit-sharma-142a26359/',
          'https://t.me/amit292004',
        ],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Who is the founder of Bounce Back Academy?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Amit Sharma is the Founder & Educator of Bounce Back Academy, providing educational study materials and coaching for NBSE Classes 8 to 12.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the contact number of Amit Sharma, Founder of Bounce Back Academy?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can contact Amit Sharma directly by phone or WhatsApp at +91 7628024274.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the official email address of Bounce Back Academy?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The official email address is bouncebackacademy.edu@gmail.com.',
          },
        },
        {
          '@type': 'Question',
          name: 'What subjects are taught at Bounce Back Academy?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Bounce Back Academy offers specialized online classes and study material for Mathematics and Science for NBSE Class 8 to 12 students, as well as guidance for CUET, JEE, and NEET.',
          },
        },
      ],
    },
  ]);

  return (
    <>
      <Script
        id="contact-json-ld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: contactJsonLd }}
      />
      {children}
    </>
  );
}
