import React from 'react';
import { Button } from '../ui/Button';

interface HeaderProps {
  status: string;
  onSetStatus: (status: any) => void;
  // Passing direct fetch functions to match App.tsx behavior of updating data on switch
  onFetchMaster: () => void;
  onFetchMappings: () => void;
  onFetchBackups: () => void;
  onFetchPaymentTypes: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onSetStatus,
  onFetchMaster,
  onFetchMappings,
  onFetchBackups,
  onFetchPaymentTypes
}) => {
  return (
    <header>
      <h1>🏦 Bank Statement Processor</h1>
      <div className="header-actions">
        {status !== 'idle' && (
          <Button onClick={() => onSetStatus('idle')} size="sm" style={{marginRight: '15px'}} variant="primary">
            ➕ Import Statement
          </Button>
        )}
        {status !== 'master' && (
          <Button variant="rollback" onClick={onFetchMaster} style={{marginRight: '10px'}}>
            📊 Master Statement
          </Button>
        )}
        {status !== 'mappings' && (
          <Button variant="rollback" onClick={onFetchMappings} style={{marginRight: '10px'}}>
            🧠 Knowledge Base
          </Button>
        )}
        {status !== 'backups' && (
          <Button variant="rollback" onClick={onFetchBackups} style={{marginRight: '10px'}}>
            📂 Manage Backups
          </Button>
        )}
        {status !== 'payment_types' && (
          <Button variant="rollback" onClick={() => { onFetchPaymentTypes(); onSetStatus('payment_types'); }} style={{marginRight: '10px'}}>
            💳 Payment Types
          </Button>
        )}
      </div>
    </header>
  );
};
