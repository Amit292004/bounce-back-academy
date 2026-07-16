"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check, GraduationCap } from 'lucide-react';
import styles from './ClassSwitcherModal.module.css';

interface Course {
  id: string;
  name: string;
  imageUrl: string | null;
  caption: string | null;
}

interface ClassSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass?: string;
}

const COURSE_COLORS: Record<string, string> = {
  '8':   '#6366f1',
  '9':   '#8b5cf6',
  '10':  '#0ea5e9',
  '11':  '#f59e0b',
  '12':  '#10b981',
  'cuet':'#06b6d4',
  'jee': '#f97316',
  'neet':'#ef4444',
};

function getCourseColor(name: string): string {
  const n = name.toLowerCase();
  for (const [key, color] of Object.entries(COURSE_COLORS)) {
    if (n.includes(key)) return color;
  }
  return '#8b5cf6'; // fallback violet
}

export default function ClassSwitcherModal({ isOpen, onClose, currentClass }: ClassSwitcherModalProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch courses list
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/admin/courses');
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    };

    // Check if user is logged in
    const checkUser = async () => {
      try {
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data);
          }
        }
      } catch (err) {
        console.error('Failed to get student auth:', err);
      }
    };

    fetchCourses();
    checkUser();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectClass = async (className: string) => {
    setLoading(true);

    try {
      // If user is logged in, sync selection to their DB profile
      if (user) {
        await fetch('/api/student/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: user.name,
            className: className,
            mobile: user.mobile
          })
        });
      }

      // Save to localStorage so client-side state is consistent
      localStorage.setItem('selectedClass', className);

      // Close modal and navigate directly to the classroom portal for the class
      onClose();
      router.push(`/class/${encodeURIComponent(className)}`);
    } catch (err) {
      console.error('Failed to switch class:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <GraduationCap className={styles.capIcon} size={22} />
            <div>
              <h3 className={styles.title}>Switch Class / Course</h3>
              <p className={styles.sub}>Choose your study dashboard</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.grid}>
          {courses.map((course) => {
            const color = getCourseColor(course.name);
            const isActive = currentClass
              ? currentClass.toLowerCase() === course.name.toLowerCase()
              : false;

            return (
              <button
                key={course.id}
                className={`${styles.card} ${isActive ? styles.activeCard : ''}`}
                onClick={() => handleSelectClass(course.name)}
                disabled={loading}
              >
                <div className={styles.cardLeft}>
                  <div className={styles.accentBar} style={{ background: color }} />
                  <div className={styles.cardInfo}>
                    <span className={styles.className}>{course.name}</span>
                    {course.caption && <span className={styles.classCaption}>{course.caption}</span>}
                  </div>
                </div>
                {isActive && (
                  <div className={styles.checkCircle} style={{ background: color }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
