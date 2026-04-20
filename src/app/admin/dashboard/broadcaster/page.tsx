"use client";

import { useState, useEffect } from 'react';
import { FaPaperPlane, FaImage, FaCheckCircle, FaTrash, FaInfoCircle, FaEnvelopeOpenText, FaHistory } from 'react-icons/fa';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function BroadcasterPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Range & Tracking State
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(500);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        // data is already ordered by createdAt: 'asc' from the API
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on range (index + 1)
    const filtered = users.filter((u, idx) => {
      const rank = idx + 1;
      return rank >= rangeStart && rank <= rangeEnd;
    });
    setFilteredUsers(filtered);
  }, [users, rangeStart, rangeEnd]);

  const handleReset = () => {
    if (!confirm('Are you sure you want to reset the "Sent" status? This will allow you to send to these users again.')) return;
    setSentSet(new Set());
    setSuccess('Broadcasting status reset.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      setError('Subject and message are required.');
      return;
    }

    const targets = filteredUsers.filter(u => !sentSet.has(u.id));
    if (targets.length === 0) {
      setError('All selected users in this range have already been sent this announcement.');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      let imageUrl = '';
      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('Failed to upload image');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch('/api/admin/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          imageUrl: imageUrl || undefined,
          userIds: targets.map(u => u.id)
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send emails');

      // Update tracking
      const newSent = new Set(sentSet);
      targets.forEach(u => newSent.add(u.id));
      setSentSet(newSent);

      setSuccess(`Success! Sent to ${targets.length} users.`);
      setSubject('');
      setMessage('');
      setImage(null);
      setImagePreview(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Broadcaster</h1>
          <p style={{ opacity: 0.6, fontSize: '1.1rem' }}>Reach your students directly through their inbox.</p>
        </div>
        <button 
          onClick={handleReset}
          style={{ 
            padding: '0.6rem 1.2rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', 
            border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, 
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' 
          }}
        >
          <FaHistory size={14} /> Reset Tracking
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '2rem', alignItems: 'start' }} className="broadcaster-grid">
        {/* Main Content: Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Range Selection Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(99,102,241,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <FaEnvelopeOpenText size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Range Selection</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Choose the range of students to target.</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase' }}>Start Rank (#)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={rangeStart}
                  onChange={e => setRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.2rem' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase' }}>End Rank (#)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={rangeEnd}
                  onChange={e => setRangeEnd(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.2rem' }}
                />
              </div>
            </div>

            {/* Selected Users List */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.4, marginBottom: '0.8rem', textTransform: 'uppercase' }}>Selected Recipients ({filteredUsers.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                {filteredUsers.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', opacity: 0.5, padding: '0.5rem' }}>No users found in this range.</div>
                ) : (
                  filteredUsers.map(u => {
                    const idx = users.findIndex(x => x.id === u.id);
                    const isSent = sentSet.has(u.id);
                    return (
                      <div key={u.id} style={{ 
                        padding: '0.4rem 0.75rem', borderRadius: '8px', background: isSent ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isSent ? 'rgba(16,185,129,0.2)' : 'var(--surface-border)'}`,
                        display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem'
                      }}>
                        <span style={{ opacity: 0.4, fontWeight: 800 }}>#{idx + 1}</span>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                        {isSent && <FaCheckCircle color="#10b981" size={10} />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Message Form Card */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            {success && (
              <div style={{ padding: '1.5rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FaCheckCircle size={20} />
                <span style={{ fontWeight: 600 }}>{success}</span>
              </div>
            )}

            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {error && (
                <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8, marginBottom: '0.6rem', display: 'block' }}>Email Subject Line</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="E.g., Special Announcement for CBSE Finals"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  disabled={sending}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8, marginBottom: '0.6rem', display: 'block' }}>Main Message Content</label>
                <textarea 
                  className="form-input" 
                  placeholder="Write your announcement message here..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  disabled={sending}
                  required
                  rows={10}
                  style={{ resize: 'vertical', minHeight: '200px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8, marginBottom: '0.6rem', display: 'block' }}>Feature Image (Optional)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ 
                    flex: 1, cursor: sending ? 'not-allowed' : 'pointer', border: '2px dashed var(--surface-border)',
                    borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '0.5rem', background: 'rgba(255,255,255,0.01)', transition: 'all 0.2s'
                  }} className="upload-dropzone">
                    <FaImage size={24} color="var(--primary)" />
                    <span style={{ fontWeight: 600 }}>{image ? 'Replace Image' : 'Choose Image'}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Supports PNG, JPG (max 5MB)</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} disabled={sending} />
                  </label>
                  {image && (
                    <button type="button" onClick={() => { setImage(null); setImagePreview(null); }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', width: '45px', height: '45px', borderRadius: '12px', cursor: 'pointer' }}>
                      <FaTrash size={16} />
                    </button>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={sending || loading} 
                style={{ 
                  padding: '1.25rem', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
                  marginTop: '1rem', boxShadow: '0 15px 30px -10px rgba(99,102,241,0.4)'
                }}
              >
                {sending ? 'Broadcasting now...' : <><FaPaperPlane /> Send Broadcast</>}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar: Real-time Preview */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, marginBottom: '1rem' }}>Live Device Preview</div>
          <div style={{ 
            background: 'white', borderRadius: '24px', padding: '10px', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)',
            border: '8px solid #1e293b', maxWidth: '380px', margin: '0 auto'
          }}>
            <div style={{ background: '#f1f5f9', borderRadius: '16px', height: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Header Mock */}
              <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '4px' }}>From: Bounce Back Academy</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{subject || 'Announcement Subject'}</div>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem', background: 'white', flex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#6366f1' }}>BOUNCE BACK ACADEMY</div>
                </div>

                {imagePreview && (
                  <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <img src={imagePreview} alt="Announcement" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                )}

                <div style={{ 
                  fontSize: '0.9rem', lineHeight: 1.6, color: '#334155', 
                  whiteSpace: 'pre-wrap', minHeight: '150px' 
                }}>
                  {message || 'Type your message on the left to see the preview here...'}
                </div>

                <div style={{ marginTop: '2.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.6rem', color: '#94a3b8', margin: 0 }}>© 2024 Bounce Back Academy</p>
                  <p style={{ fontSize: '0.6rem', color: '#94a3b8' }}>NBSE Exam Preparation Platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Student Status Directory</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ padding: '0.3rem 0.8rem', background: 'var(--primary)', color: 'white', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>{users.length} Total</span>
            <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>Real-time delivery tracking for all students.</span>
          </div>
        </div>

        <div className="directory-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header for Desktop */}
          <div className="directory-header" style={{ 
            display: 'grid', gridTemplateColumns: '80px 1fr 1fr 150px', padding: '1rem 1.5rem', 
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', 
            borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem', opacity: 0.4, textTransform: 'uppercase' 
          }}>
            <div>Rank</div>
            <div>Student</div>
            <div>Email</div>
            <div style={{ textAlign: 'right' }}>Status</div>
          </div>

          {users.map((u, idx) => {
            const isSent = sentSet.has(u.id);
            return (
              <div key={u.id} className="directory-row" style={{ 
                display: 'grid', gridTemplateColumns: '80px 1fr 1fr 150px', padding: '1.25rem 1.5rem', 
                background: isSent ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.01)', 
                border: `1px solid ${isSent ? 'rgba(16,185,129,0.15)' : 'var(--surface-border)'}`, 
                borderRadius: '16px', alignItems: 'center', transition: 'all 0.2s ease',
                boxShadow: isSent ? '0 4px 20px -10px rgba(16,185,129,0.1)' : 'none'
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, opacity: isSent ? 0.8 : 0.2, color: isSent ? '#10b981' : 'inherit' }}>
                  #{idx + 1}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{u.name}</div>
                <div style={{ opacity: 0.6, fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>{u.email}</div>
                <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
                  {isSent ? (
                    <div style={{ 
                      padding: '0.4rem 0.9rem', background: '#dcfce7', color: '#059669', 
                      borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', 
                      alignItems: 'center', gap: '0.4rem', border: '1px solid #10b981' 
                    }}>
                      <FaCheckCircle size={12} /> Sent
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '0.4rem 0.9rem', background: '#f1f5f9', color: '#1e293b', 
                      borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', 
                      alignItems: 'center', gap: '0.4rem', border: '1px solid #e2e8f0' 
                    }}>
                      <span>⌛</span> Pending
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {users.length === 0 && (
            <div style={{ padding: '5rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed var(--surface-border)' }}>
              <div style={{ opacity: 0.2, marginBottom: '1.5rem' }}><FaEnvelopeOpenText size={48} /></div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Students Registered</h3>
              <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>They will appear here once they sign up and verify their email.</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .broadcaster-grid {
            grid-template-columns: 1fr !important;
          }
          .broadcaster-grid > div:last-child {
            position: static !important;
            margin-top: 2rem;
          }
        }
        @media (max-width: 768px) {
          .directory-header {
            display: none !important;
          }
          .directory-row {
            grid-template-columns: 1fr !important;
            gap: 0.75rem;
            padding: 1.5rem !important;
            position: relative;
          }
          .directory-row > div:nth-child(1) {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            font-size: 0.9rem !important;
            opacity: 0.4 !important;
          }
          .directory-row > div:nth-child(4) {
            justify-content: flex-start !important;
            margin-top: 0.5rem;
          }
        }

        .form-input {
          width: 100%;
          padding: 1rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--surface-border);
          color: var(--foreground);
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }
        .form-input:focus {
          border-color: var(--primary);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
        }
        .upload-dropzone:hover {
          border-color: var(--primary);
          background: rgba(99,102,241,0.02) !important;
        }
      ` }} />
    </div>
  );
}
