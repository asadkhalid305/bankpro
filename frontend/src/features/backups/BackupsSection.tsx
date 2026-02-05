import React from 'react';
import type { Backup, Transaction } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

interface BackupsSectionProps {
  backups: Backup[];
  onPreview: (filename: string) => void;
  previewData: Transaction[] | null;
  selectedBackup: string | null;
  onRestore: (filename: string) => void;
  onClosePreview: () => void;
}

export const BackupsSection: React.FC<BackupsSectionProps> = ({
  backups,
  onPreview,
  previewData,
  selectedBackup,
  onRestore,
  onClosePreview
}) => {
  const [confirmText, setConfirmText] = React.useState('');

  const handleRestoreClick = () => {
    if (selectedBackup && confirmText === 'RESTORE') {
      onRestore(selectedBackup);
      setConfirmText('');
    }
  };

  return (
    <div className="backups-section">
      <h2>Backup History</h2>
      <div className="backup-list">
        {backups.length === 0 && <p>No backups found.</p>}
        {backups.map(b => (
          <div key={b.filename} className="backup-item">
            <div className="backup-info">
              <strong>{b.date}</strong>
              <span>{b.filename} ({b.size})</span>
            </div>
            <Button onClick={() => onPreview(b.filename)} variant="rollback">Preview</Button>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!previewData} 
        onClose={onClosePreview}
        title={`Preview: ${selectedBackup}`}
        footer={
          <>
            <Button onClick={onClosePreview} variant="secondary">Close</Button>
            <Button 
                onClick={handleRestoreClick} 
                variant="primary" 
                color="error"
                disabled={confirmText !== 'RESTORE'}
            >
                Execute
            </Button>
          </>
        }
      >
         <div className="table-container mini">
            <table>
                <thead>
                <tr><th>Date</th><th>Merchant</th><th>Category</th><th>Price</th></tr>
                </thead>
                <tbody>
                {previewData?.map((r, i) => (
                    <tr key={i}>
                    <td>{r.DATE}</td>
                    <td>{r.MERCHANT}</td>
                    <td>{r.CATEGORY}</td>
                    <td>{r.PRICE}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
        <div className="restore-confirm">
            <p className="warning">⚠️ This will overwrite your current statement with this version.</p>
            <div className="input-group">
            <label>Type <strong>RESTORE</strong></label>
            <Input 
                type="text" 
                value={confirmText} 
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="..."
            />
            </div>
        </div>
      </Modal>
    </div>
  );
};
