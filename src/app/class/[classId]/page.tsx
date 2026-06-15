import Link from "next/link";
import styles from "./page.module.css";
import { ArrowLeft, GraduationCap, FileText, BookOpen, Video as VideoIcon, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ classId: string }>;
}

export default async function ClassHub({ params }: Props) {
  const { classId: rawClassId } = await params;
  // Bug Fix #1 & #2: classId arrives URL-encoded (e.g. "Class%2010").
  // Decode it first so DB queries and display use the real name (e.g. "Class 10").
  const classId = decodeURIComponent(rawClassId);

  const isSpecial = ['CUET', 'JEE', 'NEET'].includes(classId.toUpperCase());
  const dbClassName = isSpecial ? classId.toUpperCase() : (classId.toLowerCase().startsWith('class') ? classId : `Class ${classId}`);
  const displayTitle = dbClassName;

  // Fetch content for this specific class
  const [papers, notes, videos] = await Promise.all([
    prisma.questionPaper.findMany({
      where: { className: dbClassName },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.note.findMany({
      where: { className: dbClassName },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.video.findMany({
      // Bug Fix #3: Videos have a direct `category` field that stores the class name.
      // The previous join via subject->chapters was incorrect and always returned nothing.
      where: { category: dbClassName },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backBtn}>
        <ArrowLeft size={18} /> Back to Home
      </Link>

      <header className={styles.header}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', marginBottom: '1.5rem', color: 'var(--primary)' }}>
          <GraduationCap size={48} />
        </div>
        <h1 className={`${styles.title} text-gradient`}>{displayTitle} Content</h1>
        <p className={styles.subtitle}>All your study resources in one place</p>
      </header>

      {/* Papers Section */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
            <FileText color="#6366f1" /> Previous Papers
          </h2>
          <Link href={`/papers?class=${dbClassName}`} className="text-gradient" style={{ fontWeight: 600 }}>
            View All →
          </Link>
        </div>
        
        {papers.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>
            No papers found for this class yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {papers.map(paper => (
              <div key={paper.id} className="glass-panel tactile-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{paper.title}</h3>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {paper.subject.name}
                  </span>
                </div>
                <Link href={paper.viewUrl || paper.downloadFile || '#'} target="_blank" className="btn-secondary haptic-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  Open <ExternalLink size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Notes Section */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
            <BookOpen color="#10b981" /> Study Notes
          </h2>
          <Link href={`/notes?class=${dbClassName}`} className="text-gradient" style={{ fontWeight: 600 }}>
            View All →
          </Link>
        </div>
        
        {notes.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>
            No notes found for this class yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {notes.map(note => (
              <div key={note.id} className="glass-panel tactile-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{note.title}</h3>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {note.subject.name}
                  </span>
                </div>
                <Link href={note.viewUrl || note.downloadFile || '#'} target="_blank" className="btn-secondary haptic-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  Read <ExternalLink size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Videos Section */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
            <VideoIcon color="#f59e0b" /> Video Lectures
          </h2>
          <Link href={`/videos?class=${dbClassName}`} className="text-gradient" style={{ fontWeight: 600 }}>
            View All →
          </Link>
        </div>
        
        {videos.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>
            No videos found for this class yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {videos.map(video => {
              // Extract YouTube video ID
              const videoIdMatch = video.youtubeLink?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
              const videoId = videoIdMatch ? videoIdMatch[1] : null;
              // Use mqdefault (medium quality) or hqdefault (high quality) for thumbnails
              const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

              return (
                <a key={video.id} href={video.youtubeLink} target="_blank" rel="noreferrer" className={`glass-panel tactile-card ${styles.videoCard}`} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: 'var(--surface-highlight)', overflow: 'hidden' }}>
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <VideoIcon size={48} opacity={0.5} />
                      </div>
                    )}
                    <div className={styles.playOverlay}>
                      <div className={styles.playButton}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem', lineHeight: 1.4 }} className="line-clamp-2">{video.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '0.25rem 0.6rem', borderRadius: '999px' }}>
                        {video.subject?.name || 'General'}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
