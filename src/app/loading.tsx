export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div
        className="animate-spin"
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--surface-border)',
          borderTop: '4px solid var(--primary)',
          borderRadius: '50%',
        }}
        aria-label="Loading"
      />
      <p style={{ opacity: 0.6, fontSize: '0.95rem' }}>Loading…</p>
    </div>
  );
}
