import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 32, color = '#00FFFF', className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray="60 40"
            opacity="0.8"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;
