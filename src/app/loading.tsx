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
          width: '36px',
          height: '36px',
          border: '3px solid var(--surface-border)',
          borderTop: '3px solid var(--foreground)',
          borderRadius: '50%',
        }}
        aria-label="Loading"
      />
      <p style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>Loading…</p>
    </div>
  );
}
