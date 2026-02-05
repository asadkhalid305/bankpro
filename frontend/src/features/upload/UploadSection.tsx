import React, { useRef } from 'react';
import { Button } from '../../components/ui/Button';

interface UploadSectionProps {
  file: File | null;
  status: 'idle' | 'uploading' | 'review' | 'merging' | 'success' | 'error';
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ 
  file, 
  status, 
  onFileChange, 
  onUpload 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to trigger file clearing if needed from parent, though React state handles the logical part
  // The original App.tsx manually formatted the input value to empty string. We'll handle that via ref if we were to fully replicate logic or trust React key reset pattern.
  // For now, simpler implementation:

  return (
    <div className="upload-section">
      <div className="upload-area">
        <input 
            type="file" 
            id="fileInput" 
            onChange={onFileChange} 
            ref={fileInputRef}
            // Add key to force re-render/reset if file is null? Or just let parent handle logic.
        />
        <label htmlFor="fileInput" className="file-label">
          {file ? <span>📄 {file.name}</span> : <span>Click to Select Statement (PDF/XLSX)</span>}
        </label>
      </div>
      <Button 
        onClick={onUpload} 
        disabled={!file || status === 'uploading'} 
        variant="primary"
      >
        {status === 'uploading' ? 'Parsing...' : 'Upload & Review'}
      </Button>
    </div>
  );
};
