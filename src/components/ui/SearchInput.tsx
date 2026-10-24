"use client";

import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchInput.module.css';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search by title, subject, chapter...',
  className = '',
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <span className={styles.icon}>
        <Search size={18} />
      </span>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className={styles.clearButton}
          aria-label="Clear search input"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
