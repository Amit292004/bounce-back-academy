import React from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  compact = false,
}) => {
  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''} ${className}`}>
      {icon && <div className={`${styles.iconCircle} ${compact ? styles.compactIcon : ''}`}>{icon}</div>}
      <h3 className={`${styles.title} ${compact ? styles.compactTitle : ''}`}>{title}</h3>
      {description && <p className={`${styles.description} ${compact ? styles.compactDescription : ''}`}>{description}</p>}
      {action && <div className={styles.actions}>{action}</div>}
    </div>
  );
};

export default EmptyState;
