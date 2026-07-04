"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  X,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileImage,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, useUploadStore, useDocumentStore } from '@/lib/stores';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/types';

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return FileSpreadsheet;
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('python')) return FileCode;
  if (mimeType.includes('epub')) return BookOpen;
  return FileText;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return Object.values(ACCEPTED_FILE_TYPES).flat().includes(ext);
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export function UploadModal() {
  const { isUploadModalOpen, closeUploadModal } = useUIStore();
  const { addDocument } = useDocumentStore();
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles
      .filter((file) => {
        if (!isValidFileType(file.name)) {
          toast.error(`Invalid file type: ${file.name}`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File too large: ${file.name} (max 50MB)`);
          return false;
        }
        return true;
      })
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: 'pending' as const,
      }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    noKeyboard: true,
  });

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    const pendingFiles = files.filter((f) => f.status === 'pending');

    for (const uploadFile of pendingFiles) {
      try {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
          )
        );

        // Read file content
        const fileContent = await uploadFile.file.arrayBuffer();

        // Create document record
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .insert({
            title: uploadFile.file.name.replace(/\.[^/.]+$/, ''),
            filename: uploadFile.file.name,
            mime_type: uploadFile.file.type || 'application/octet-stream',
            size: uploadFile.file.size,
            status: 'pending',
          })
          .select()
          .single();

        if (docError) throw docError;

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, progress } : f
            )
          );
          await new Promise((r) => setTimeout(r, 100));
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'processing', progress: 100 } : f
          )
        );

        // Simulate processing
        await new Promise((r) => setTimeout(r, 1000));

        // Update document status
        const { error: updateError } = await supabase
          .from('documents')
          .update({ status: 'completed', page_count: 1, word_count: 1000 })
          .eq('id', doc.id);

        if (updateError) throw updateError;

        addDocument({ ...doc, status: 'completed', page_count: 1, word_count: 1000 });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'completed' } : f
          )
        );

        toast.success(`Uploaded: ${uploadFile.file.name}`);
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          )
        );
        toast.error(`Failed to upload: ${uploadFile.file.name}`);
      }
    }

    setIsUploading(false);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'completed'));
  };

  const handleClose = () => {
    if (isUploading) {
      toast.info('Upload in progress...');
      return;
    }
    setFiles(files.filter((f) => f.status === 'uploading' || f.status === 'processing'));
    closeUploadModal();
  };

  return (
    <Dialog open={isUploadModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3 text-center">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                isDragActive ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">
                  {isDragActive ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or <span className="text-primary underline">browse</span> to select files
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports PDF, DOCX, TXT, PPTX, Images, Code files (max 50MB)
              </p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{files.length} file(s)</span>
                <Button variant="ghost" size="sm" onClick={clearCompleted}>
                  Clear completed
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {files.map((file) => {
                  const Icon = getFileIcon(file.file.type);
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        file.status === 'error' && "border-destructive bg-destructive/5",
                        file.status === 'completed' && "border-green-500/50 bg-green-500/5"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                        file.status === 'completed' && "bg-green-500/10",
                        file.status === 'error' && "bg-destructive/10",
                        file.status === 'processing' && "bg-primary/10",
                        (!file.status || file.status === 'pending' || file.status === 'uploading') && "bg-muted"
                      )}>
                        {file.status === 'uploading' || file.status === 'processing' ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : file.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : file.status === 'error' ? (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{file.file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {(file.file.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                        </div>
                        {file.status === 'uploading' && (
                          <Progress value={file.progress} className="h-1 mt-1" />
                        )}
                        {file.status === 'error' && file.error && (
                          <p className="text-xs text-destructive mt-1">{file.error}</p>
                        )}
                      </div>
                      {(file.status === 'pending' || file.status === 'error') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removeFile(file.id)}
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={uploadFiles}
              disabled={files.filter((f) => f.status === 'pending').length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {files.filter((f) => f.status === 'pending').length} file(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
