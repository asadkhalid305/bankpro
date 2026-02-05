import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: string[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  options = [], 
  placeholder, 
  value, 
  className = '', 
  children,
  ...props 
}) => {
  return (
    <select 
      value={value} 
      className={`category-select ${className}`} 
      {...props}
    >
      {children}
      {!children && placeholder && <option value="">{placeholder}</option>}
      {!children && options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
};
