"use client";

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';
import { logger } from '@/lib/logger'

interface Year {
  id: string;
  year: string;
}

export default function YearsPage() {
  const [years, setYears] = useState<Year[]>([]);
  const [newYear, setNewYear] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/admin/years');
      const data = await res.json();
      setYears(data);
    } catch (err) {
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear.trim()) return;

    try {
      await fetch('/api/admin/years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: newYear }),
      });
      setNewYear('');
      fetchYears();
    } catch (err) {
      logger.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this year?')) return;

    try {
      await fetch(`/api/admin/years/${id}`, { method: 'DELETE' });
      fetchYears();
    } catch (err) {
      logger.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Manage Academic Years</h1>
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add New Year</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            placeholder="Year (e.g. 2024)"
            style={{ 
              flex: '1 1 200px', padding: '0.75rem', borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' 
            }}
            required
          />
          <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap', flex: '1 1 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlus /> Add Year
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '400px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-highlight)' }}>
              <th style={{ padding: '1rem' }}>Academic Year</th>
              <th style={{ padding: '1rem', width: '100px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {years.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No years found.</td>
              </tr>
            ) : years.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <td style={{ padding: '1rem' }}>{item.year}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                  >
                    <FaTrash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
