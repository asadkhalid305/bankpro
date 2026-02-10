import React, { useRef } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface UploadSectionProps {
  file: File | null;
  status: 'idle' | 'uploading' | 'review' | 'merging' | 'success' | 'error' | 'new_file_created';
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  createNewFile: boolean; // New prop
  setCreateNewFile: (value: boolean) => void; // New prop
}

export const UploadSection: React.FC<UploadSectionProps> = ({ 
  file, 
  status, 
  onFileChange, 
  onUpload,
  createNewFile,
  setCreateNewFile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropEvent = {
        target: { files: e.dataTransfer.files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onFileChange(dropEvent);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Import Statement</h1>
        <p className="text-muted-foreground text-lg">
          Upload your bank statement to begin processing.
        </p>
      </div>

      <Card 
        className={cn(
          "border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden",
          file ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/50"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <input 
            type="file" 
            id="fileInput" 
            className="hidden"
            onChange={onFileChange} 
            ref={fileInputRef}
            accept=".pdf,.xlsx,.csv"
          />
          
          <div className={cn(
            "p-4 rounded-full transition-colors",
            file ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {file ? <FileText size={32} /> : <Upload size={32} />}
          </div>

          <div className="space-y-1">
            {file ? (
              <>
                <p className="text-xl font-semibold text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to process
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold text-foreground">Click or drag file here</p>
                <p className="text-sm text-muted-foreground">
                  Support for PDF, XLSX, and CSV statements
                </p>
              </>
            )}
          </div>

          {file && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-4"
              onClick={(e) => {
                e.stopPropagation();
                if (fileInputRef.current) fileInputRef.current.value = '';
                const emptyEvent = { target: { files: null } } as unknown as React.ChangeEvent<HTMLInputElement>;
                onFileChange(emptyEvent);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Remove File
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="createNewFile"
          checked={createNewFile}
          onChange={(e) => setCreateNewFile(e.target.checked)}
          className="form-checkbox h-5 w-5 text-primary rounded"
        />
        <label htmlFor="createNewFile" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Create a new file instead of merging with master statement
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <Button 
          onClick={onUpload} 
          disabled={!file || status === 'uploading'} 
          className="w-full py-6 text-lg"
          size="lg"
        >
          {status === 'uploading' ? (
            <>
              <Upload className="w-5 h-5 mr-3 animate-bounce" />
              Processing Statement...
            </>
          ) : (
            'Process & Review Transactions'
          )}
        </Button>

        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground font-medium uppercase tracking-widest">
           <span className="flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Secure Upload</span>
           <span className="flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Local Processing</span>
           <span className="flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Smart Mapping</span>
        </div>
      </div>
    </div>
  );
};

