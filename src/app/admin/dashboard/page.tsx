import prisma from "@/lib/prisma";
import { FaBook, FaCalendarAlt, FaFileAlt, FaVideo, FaUsers } from 'react-icons/fa';

export const revalidate = 0; // Disable caching for dashboard

export default async function AdminDashboard() {
  const [
    userCount,
    subjectCount,
    paperCount,
    noteCount,
    videoCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subject.count(),
    prisma.questionPaper.count(),
    prisma.note.count(),
    prisma.video.count()
  ]);

  const stats = [
    { label: 'Total Users', value: userCount, icon: <FaUsers size={24} />, color: '#ec4899' },
    { label: 'Subjects', value: subjectCount, icon: <FaBook size={24} />, color: '#6366f1' },
    { label: 'Question Papers', value: paperCount, icon: <FaFileAlt size={24} />, color: '#10b981' },
    { label: 'Notes', value: noteCount, icon: <FaFileAlt size={24} />, color: '#f59e0b' },
    { label: 'Videos', value: videoCount, icon: <FaVideo size={24} />, color: '#8b5cf6' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Dashboard Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: `${stat.color}20`, color: stat.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.value}</div>
              <div style={{ opacity: 0.8, fontSize: '0.875rem', fontWeight: 500 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
