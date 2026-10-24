import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  interactive?: boolean;
  elevated?: boolean;
  flat?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padded = true,
  interactive = false,
  elevated = false,
  flat = false,
  className = '',
  ...props
}) => {
  const classes = [
    styles.card,
    padded ? styles.padded : '',
    interactive ? styles.interactive : '',
    elevated ? styles.elevated : '',
    flat ? styles.flat : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
