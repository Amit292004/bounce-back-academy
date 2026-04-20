"use client";

import { useState } from 'react';
import { FaHeart, FaRegHeart, FaShareAlt, FaBookmark, FaRegBookmark } from 'react-icons/fa';

interface InteractionButtonsProps {
  targetId: string;
  targetType: 'VIDEO' | 'NOTE' | 'PAPER';
  initialLikes?: number;
  initialShares?: number;
  initialFavorites?: number;
  isLiked?: boolean;
  isFavorited?: boolean;
  isAuthenticated: boolean;
}

export default function InteractionButtons({
  targetId,
  targetType,
  initialLikes = 0,
  initialShares = 0,
  initialFavorites = 0,
  isLiked: initialIsLiked = false,
  isFavorited: initialIsFavorited = false,
  isAuthenticated
}: InteractionButtonsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [shares, setShares] = useState(initialShares);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return alert('Please login to like');
    
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikes(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      const res = await fetch('/api/interactions/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, targetType })
      });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(!newIsLiked);
      setLikes(prev => !newIsLiked ? prev + 1 : prev - 1);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return alert('Please login to add to favorites');

    const newIsFavorited = !isFavorited;
    setIsFavorited(newIsFavorited);
    setFavorites(prev => newIsFavorited ? prev + 1 : prev - 1);

    try {
      const res = await fetch('/api/interactions/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, targetType })
      });
      if (!res.ok) throw new Error();
    } catch {
      setIsFavorited(!newIsFavorited);
      setFavorites(prev => !newIsFavorited ? prev + 1 : prev - 1);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Bounce Back Academy',
          text: 'Check out this educational content on Bounce Back Academy!',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }

      setShares(prev => prev + 1);
      await fetch('/api/interactions/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, targetType })
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
      }
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--surface-border)', flexWrap: 'wrap' }}>
      <button 
        onClick={handleLike}
        title="Like"
        style={{ background: 'transparent', border: 'none', color: isLiked ? '#ef4444' : 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 500, padding: 0, opacity: isLiked ? 1 : 0.6, transition: 'var(--transition)' }}
      >
        {isLiked ? <FaHeart style={{ fontSize: '1rem' }} /> : <FaRegHeart style={{ fontSize: '1rem' }} />} 
        <span>{likes}</span>
      </button>

      <button 
        onClick={handleFavorite}
        title="Add to Favorite"
        style={{ background: 'transparent', border: 'none', color: isFavorited ? 'var(--primary)' : 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 500, padding: 0, opacity: isFavorited ? 1 : 0.6, transition: 'var(--transition)' }}
      >
        {isFavorited ? <FaBookmark style={{ fontSize: '1rem' }} /> : <FaRegBookmark style={{ fontSize: '1rem' }} />} 
        <span>{favorites}</span>
      </button>

      <button 
        onClick={handleShare}
        title="Share"
        style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 500, padding: 0, opacity: 0.6, transition: 'var(--transition)' }}
      >
        <FaShareAlt style={{ fontSize: '1rem' }} /> 
        <span>{shares}</span>
      </button>
    </div>
  );
}
