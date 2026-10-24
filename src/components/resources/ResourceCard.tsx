'use client';

import React from 'react';
import { FileText, BookOpen, Video as VideoIcon, Play, Eye, Download } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getViewLink, handleDownload } from '@/lib/utils';
import styles from './ResourceCard.module.css';

export interface ResourceCardProps {
  id: string;
  title: string;
  type: 'NOTE' | 'PAPER' | 'VIDEO';
  className: string;
  subjectName: string;
  chapterName?: string | null;
  year?: string | null;
  viewUrl?: string;
  downloadFile?: string;
  youtubeLink?: string;
  pdfUrl?: string | null;
  // Actions
  onViewPdf?: (url: string, title: string) => void;
  onPlayVideo?: (resource: ResourceCardProps) => void;
}

export default function ResourceCard({
  id,
  title,
  type,
  className,
  subjectName,
  chapterName,
  year,
  viewUrl,
  downloadFile,
  youtubeLink,
  pdfUrl,
  onViewPdf,
  onPlayVideo,
}: ResourceCardProps) {
  const isNote = type === 'NOTE';
  const isPaper = type === 'PAPER';
  const isVideo = type === 'VIDEO';

  const iconBg = isNote
    ? 'rgba(99, 102, 241, 0.15)'
    : isPaper
    ? 'rgba(239, 68, 68, 0.15)'
    : 'rgba(6, 182, 212, 0.15)';

  const iconColor = isNote ? '#818cf8' : isPaper ? '#f87171' : '#22d3ee';

  const badgeVariant: 'primary' | 'danger' | 'cyan' = isNote
    ? 'primary'
    : isPaper
    ? 'danger'
    : 'cyan';

  const badgeLabel = isNote ? 'Study Note' : isPaper ? 'Board Paper' : 'Video Lesson';

  const handlePlay = () => {
    if (onPlayVideo) {
      onPlayVideo({
        id,
        title,
        type,
        className,
        subjectName,
        chapterName,
        year,
        viewUrl,
        downloadFile,
        youtubeLink,
        pdfUrl,
      });
    }
  };

  return (
    <div className={styles.resourceCard}>
      <div className={styles.cardHead}>
        <div
          className={styles.cardIcon}
          style={{ background: iconBg, color: iconColor }}
        >
          {isNote && <FileText size={18} />}
          {isPaper && <BookOpen size={18} />}
          {isVideo && <VideoIcon size={18} />}
        </div>
        <Badge variant={badgeVariant} size="sm">
          {badgeLabel}
        </Badge>
      </div>

      <h3 className={styles.cardTitle}>{title}</h3>

      <div className={styles.cardMeta}>
        <Badge variant="outline" size="sm">
          {className}
        </Badge>
        <Badge variant="outline" size="sm">
          {subjectName}
        </Badge>
        {year && (
          <Badge variant="purple" size="sm">
            Year {year}
          </Badge>
        )}
        {chapterName && (
          <Badge variant="warning" size="sm">
            {chapterName}
          </Badge>
        )}
      </div>

      <div className={styles.cardActions}>
        {isVideo ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handlePlay}
            style={{ width: '100%' }}
          >
            <Play size={14} />
            <span>Watch Lecture</span>
          </Button>
        ) : (
          <>
            {viewUrl && (
              <Button
                href={getViewLink(viewUrl)}
                variant="secondary"
                size="sm"
                style={{ flex: 1 }}
              >
                <Eye size={14} />
                <span>View</span>
              </Button>
            )}
            {downloadFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(downloadFile, title)}
                style={{ flex: 1 }}
              >
                <Download size={14} />
                <span>PDF</span>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
