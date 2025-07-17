'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { UploadIcon } from './icons';

interface UploadedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'error';
}

export function DocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<UploadedFile>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        const errorText = await response.text();
        toast.error(`Failed to upload ${file.name}: ${errorText}`);
        return null;
      }
    } catch (error) {
      toast.error(
        `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    // Validate file types
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');
    if (pdfFiles.length !== files.length) {
      toast.error('Only PDF files are supported');
      return;
    }

    setIsUploading(true);
    setUploadQueue(files.map((file) => file.name));

    try {
      const uploadPromises = files.map((file) => uploadFile(file));
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((result) => result !== null);

      // Add to uploaded files list
      const newFiles: UploadedFile[] = successfulUploads.map((result) => ({
        id: result.id || Date.now().toString(),
        fileName: result.fileName || 'Unknown',
        fileUrl: result.fileUrl || '',
        fileType: result.fileType || 'application/pdf',
        fileSize: result.fileSize || '0',
        uploadedAt: new Date().toISOString(),
        status: 'processing' as const,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      if (successfulUploads.length > 0) {
        toast.success(
          `Successfully uploaded ${successfulUploads.length} file(s)`,
        );
      }
    } catch (error) {
      toast.error('Error uploading files');
    } finally {
      setIsUploading(false);
      setUploadQueue([]);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);

    if (files.length > 0) {
      // Handle dropped files directly without creating synthetic event
      handleFilesDirectly(files);
    }
  };

  const handleFilesDirectly = async (files: File[]) => {
    // Validate file types
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');
    if (pdfFiles.length !== files.length) {
      toast.error('Only PDF files are supported');
      return;
    }

    setIsUploading(true);
    setUploadQueue(files.map((file) => file.name));

    try {
      const uploadPromises = files.map((file) => uploadFile(file));
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((result) => result !== null);

      // Add to uploaded files list
      const newFiles: UploadedFile[] = successfulUploads.map((result) => ({
        id: result.id || Date.now().toString(),
        fileName: result.fileName || 'Unknown',
        fileUrl: result.fileUrl || '',
        fileType: result.fileType || 'application/pdf',
        fileSize: result.fileSize || '0',
        uploadedAt: new Date().toISOString(),
        status: 'processing' as const,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      if (successfulUploads.length > 0) {
        toast.success(
          `Successfully uploaded ${successfulUploads.length} file(s)`,
        );
      }
    } catch (error) {
      toast.error('Error uploading files');
    } finally {
      setIsUploading(false);
      setUploadQueue([]);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <UploadIcon size={48} />
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Upload PDF Documents
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Drag and drop PDF files here, or click to select files
          </p>
        </div>

        <div className="mt-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mt-2"
          >
            {isUploading ? 'Uploading...' : 'Select PDF Files'}
          </Button>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Uploading:
          </h4>
          {uploadQueue.map((filename) => (
            <div
              key={filename}
              className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
            >
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {filename}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Uploaded Files ({uploadedFiles.length}):
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {file.fileName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Size: {file.fileSize} • Uploaded:{' '}
                    {new Date(file.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      file.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : file.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {file.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
