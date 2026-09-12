import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us – Bounce Back Academy',
  description:
    'Contact Amit Sharma, Founder of Bounce Back Academy. Reach us by phone (+91 7628024274), WhatsApp, email or social media for NBSE coaching enquiries.',
  alternates: { canonical: 'https://bouncebackacademy.vercel.app/contact' },
  openGraph: {
    title: 'Contact Us – Bounce Back Academy',
    description:
      'Contact Amit Sharma at Bounce Back Academy for NBSE coaching enquiries. Phone, WhatsApp, email available.',
    url: 'https://bouncebackacademy.vercel.app/contact',
    type: 'website',
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
