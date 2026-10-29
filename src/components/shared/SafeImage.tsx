'use client';

import React, { useState } from 'react';
import { getDriveImageUrl } from '@/lib/driveImage';
import { BookOpen, Sparkles, Video as VideoIcon, FileText, Layers, Award } from 'lucide-react';

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  fallbackType?: 'NOTE' | 'PAPER' | 'VIDEO' | 'COURSE' | 'LECTURE' | 'QUIZ' | 'DEFAULT';
  fallbackText?: string;
  containerClassName?: string;
  aspectRatio?: 'video' | 'square' | 'banner' | 'auto';
}

export default function SafeImage({
  src,
  alt,
  fallbackType = 'DEFAULT',
  fallbackText,
  containerClassName = '',
  className = '',
  aspectRatio = 'auto',
  style,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const resolvedSrc = src ? getDriveImageUrl(src) : null;

  const getFallbackIcon = () => {
    switch (fallbackType) {
      case 'NOTE':
        return <FileText size={28} className="safe-image-icon" />;
      case 'PAPER':
        return <Award size={28} className="safe-image-icon" />;
      case 'VIDEO':
      case 'LECTURE':
        return <VideoIcon size={28} className="safe-image-icon" />;
      case 'COURSE':
        return <Sparkles size={28} className="safe-image-icon" />;
      default:
        return <BookOpen size={28} className="safe-image-icon" />;
    }
  };

  const getFallbackGradient = () => {
    switch (fallbackType) {
      case 'NOTE':
        return 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.25) 100%)';
      case 'PAPER':
        return 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(249, 115, 22, 0.25) 100%)';
      case 'VIDEO':
      case 'LECTURE':
        return 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.25) 100%)';
      case 'COURSE':
        return 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)';
      default:
        return 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%)';
    }
  };

  const aspectStyles: Record<string, React.CSSProperties> = {
    video: { aspectRatio: '16 / 9', width: '100%' },
    square: { aspectRatio: '1 / 1', width: '100%' },
    banner: { aspectRatio: '21 / 9', width: '100%' },
    auto: { width: '100%' },
  };

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`safe-image-fallback ${containerClassName}`}
        style={{
          ...aspectStyles[aspectRatio],
          background: getFallbackGradient(),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          color: 'var(--foreground)',
          opacity: 0.9,
          padding: '1rem',
          textAlign: 'center',
          border: '1px solid var(--surface-border)',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
      >
        <div style={{ opacity: 0.8, marginBottom: '0.4rem' }}>{getFallbackIcon()}</div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            opacity: 0.7,
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fallbackText || alt}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`safe-image-container ${containerClassName}`}
      style={{
        ...aspectStyles[aspectRatio],
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        background: 'var(--surface)',
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: hasError ? 'none' : 'block',
          transition: 'opacity 0.25s ease',
          opacity: isLoading ? 0.4 : 1,
        }}
        {...props}
      />
    </div>
  );
}
