import React from 'react';
import { Card } from '../ui/Card';

interface LayoutProps {
  children: React.ReactNode;
  isFullWidth: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isFullWidth }) => {
  return (
    <div className="container">
      <Card className={isFullWidth ? 'full-width' : ''}>
        {children}
      </Card>
    </div>
  );
};
