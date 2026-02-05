import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({ className = '', fullWidth = false, ...props }) => {
  const classes = [
    // Add existing classes if any specific ones map to inputs. 
    // In App.tsx, inputs often had 'search-input' or 'inline-edit'
    className,
    fullWidth ? 'full-width' : ''
  ];
  return <input className={classes.filter(Boolean).join(' ')} {...props} />;
};
