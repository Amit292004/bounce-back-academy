"use client";

import { useState, useEffect } from 'react';
import { FaTrophy, FaFire, FaUserCircle, FaAward, FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import styles from './page.module.css';
import { logger } from '@/lib/logger'

interface LeaderboardUser {
  id: string;
  name: string;
  class: string;
  image?: string | null;
  xp: number;
  streak: number;
  likesCount: number;
  favoritesCount: number;
}

export default function LeaderboardPage() {
  const [students, setStudents] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, lbRes] = await Promise.all([
          fetch('/api/student/me'),
          fetch('/api/leaderboard'),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData);
        }

        if (lbRes.ok) {
          const lbData = await lbRes.json();
          setStudents(lbData);
        }
      } catch (error) {
        logger.error('Failed to load leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter students by selected class and search query
  const filteredStudents = students.filter((student) => {
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Podium candidates (Top 3 of ALL classes or current filter)
  const podiumStudents = filteredStudents.slice(0, 3);
  const listStudents = filteredStudents.slice(3);

  // Re-order podium for visual layout: [Rank 2, Rank 1, Rank 3]
  const orderedPodium = [];
  if (podiumStudents[1]) orderedPodium.push({ ...podiumStudents[1], rank: 2 });
  if (podiumStudents[0]) orderedPodium.push({ ...podiumStudents[0], rank: 1 });
  if (podiumStudents[2]) orderedPodium.push({ ...podiumStudents[2], rank: 3 });

  // Get current user's rank
  const currentUserRank = students.findIndex((s) => s.id === currentUser?.id) + 1;
  const currentUserData = students[currentUserRank - 1];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Calculating live XP & rankings...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.badge}>
          <FaTrophy /> BBA Arena
        </div>
        <h1 className={styles.title}>
          Weekly <span className="text-gradient">Leaderboard</span>
        </h1>
        <p className={styles.subtitle}>
          Learn smarter, earn XP, and compete with the brightest minds across subjects!
        </p>
      </div>

      {/* Current Student Progress Card */}
      {currentUser && currentUserData && (
        <div className={`glass-panel ${styles.userProgressCard}`}>
          <div className={styles.userCardLeft}>
            {currentUser.image ? (
              <img src={currentUser.image} alt={currentUser.name} className={styles.userAvatar} />
            ) : (
              <FaUserCircle className={styles.userAvatarPlaceholder} />
            )}
            <div>
              <h3 className={styles.userCardName}>{currentUser.name}</h3>
              <p className={styles.userCardClass}>Class {currentUser.class} • Student</p>
            </div>
          </div>
          <div className={styles.userStatsRow}>
            <div className={styles.userStatItem}>
              <span className={styles.statLabel}>Current Rank</span>
              <span className={styles.statValue}>#{currentUserRank}</span>
            </div>
            <div className={styles.userStatItem}>
              <span className={styles.statLabel}>Total XP</span>
              <span className={styles.statValue} style={{ color: 'var(--primary)' }}>
                {currentUserData.xp} XP
              </span>
            </div>
            <div className={styles.userStatItem}>
              <span className={styles.statLabel}>Active Streak</span>
              <span className={styles.statValue} style={{ color: '#ff7a00', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <FaFire /> {currentUserData.streak} days
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Class selector & Search */}
      <div className={styles.controlsBar}>
        <div className={styles.filterChips}>
          {['all', '9', '10', '11', '12'].map((c) => (
            <button
              key={c}
              className={`${styles.filterChip} ${selectedClass === c ? styles.activeChip : ''}`}
              onClick={() => setSelectedClass(c)}
            >
              {c === 'all' ? 'All Classes' : `Class ${c}`}
            </button>
          ))}
        </div>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* 👑 Podium Section */}
      {orderedPodium.length > 0 && (
        <div className={styles.podiumContainer}>
          {orderedPodium.map((student) => (
            <div
              key={student.id}
              className={`${styles.podiumCol} ${
                student.rank === 1 ? styles.rank1 : student.rank === 2 ? styles.rank2 : styles.rank3
              }`}
            >
              <div className={styles.avatarWrapper}>
                {student.image ? (
                  <img src={student.image} alt={student.name} className={styles.podiumAvatar} />
                ) : (
                  <FaUserCircle className={styles.podiumAvatarPlaceholder} />
                )}
                <span className={styles.rankBadge}>{student.rank}</span>
              </div>
              <div className={styles.podiumInfo}>
                <h3 className={styles.podiumName}>{student.name}</h3>
                <span className={styles.podiumClass}>Class {student.class}</span>
                <div className={styles.podiumXp}>{student.xp} XP</div>
                <div className={styles.podiumStreak}>
                  <FaFire /> {student.streak}d
                </div>
              </div>
              <div className={styles.podiumPedestal}>
                <div className={styles.pedestalRank}>{student.rank}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard Table / List */}
      <div className={`glass-panel ${styles.leaderboardBox}`}>
        <div className={styles.tableHeader}>
          <span>Rank</span>
          <span>Student</span>
          <span style={{ textAlign: 'center' }}>Class</span>
          <span style={{ textAlign: 'center' }}>Streak</span>
          <span style={{ textAlign: 'right' }}>XP Score</span>
        </div>

        <div className={styles.tableRows}>
          {listStudents.map((student, idx) => {
            const absoluteRank = idx + 4;
            const isSelf = student.id === currentUser?.id;
            return (
              <div
                key={student.id}
                className={`${styles.tableRow} ${isSelf ? styles.selfRow : ''}`}
              >
                <div className={styles.rankCol}>
                  {absoluteRank === 4 ? (
                    <FaAward style={{ color: '#00d2ff', fontSize: '1.1rem' }} />
                  ) : (
                    <span>#{absoluteRank}</span>
                  )}
                </div>
                <div className={styles.studentCol}>
                  {student.image ? (
                    <img src={student.image} alt={student.name} className={styles.listAvatar} />
                  ) : (
                    <FaUserCircle className={styles.listAvatarPlaceholder} />
                  )}
                  <span className={styles.studentName}>
                    {student.name} {isSelf && <span className={styles.youBadge}>You</span>}
                  </span>
                </div>
                <div className={styles.classCol}>Class {student.class}</div>
                <div className={styles.streakCol}>
                  <FaFire /> {student.streak} days
                </div>
                <div className={styles.xpCol}>{student.xp} XP</div>
              </div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className={styles.emptyState}>
              <p>No students found for this class or search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
