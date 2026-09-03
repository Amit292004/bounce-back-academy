"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import styles from './page.module.css';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Credentials, 2: Google

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // First step successful
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/admin/google-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google verification failed');
      }

      // Full login successful
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.loginCard} animate-fade-in`}>
        <h1 className={`${styles.title} text-gradient`}>Admin Portal</h1>
        <p className={styles.subtitle}>
          {step === 1 ? 'Sign in with credentials' : 'Step 2: Verify with Google'}
        </p>

        {error && <div className={styles.error}>{error}</div>}

        {step === 1 ? (
          <form className={styles.form} onSubmit={handleCredentialsSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className={`btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Next Step'}
            </button>
          </form>
        ) : (
          <div className={styles.googleStep}>
            <p className={styles.googleNotice}>
              To complete the login, please sign in with your associated Google account. 
              {/* Note for the user: The first Google account you use will be locked to your admin profile. */}
            </p>
            
            <div className={styles.googleButtonWrapper}>
              <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Sign In failed')}
                  text="continue_with"
                />
              </GoogleOAuthProvider>
            </div>

            <button 
              className={styles.backBtn}
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back to credentials
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
