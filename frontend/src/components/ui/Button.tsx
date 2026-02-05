import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'rollback' | 'download';
  size?: 'sm' | 'md' | 'lg';
  color?: 'success' | 'error' | 'default';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  color = 'default',
  className = '',
  children, 
  ...props 
}) => {
  let baseClass = '';
  
  switch (variant) {
    case 'primary':
      baseClass = 'primary-btn';
      break;
    case 'secondary':
      baseClass = 'secondary-btn';
      break;
    case 'rollback':
      baseClass = 'rollback-btn';
      break;
    case 'download':
      baseClass = 'download-btn';
      break;
  }

  // Append size and color modifiers if creating a custom class structure or just using the string appends existing in App.css
  // Based on current App.css usage: 'sm', 'success', 'error', 'error-text' are classes
  
  const classes = [baseClass, size === 'sm' ? 'sm' : '', className];
  
  if (color === 'success') classes.push('success');
  if (color === 'error') classes.push('error');
  // 'rollback-btn' often had 'error-text' appended in original code for delete actions
  if (variant === 'rollback' && color === 'error') classes.push('error-text');

  return (
    <button className={classes.filter(Boolean).join(' ')} {...props}>
      {children}
    </button>
  );
};
