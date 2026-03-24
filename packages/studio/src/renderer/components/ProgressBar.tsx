import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = '' }) => {
  return (
    <div className={`progress-bar ${className}`}>
      <div
        className="progress-bar__fill"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};
