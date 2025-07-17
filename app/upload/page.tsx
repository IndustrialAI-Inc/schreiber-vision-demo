'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Package,
  Loader2,
  Eye,
  Search,
  ArrowLeft,
} from 'lucide-react';

interface UploadedFile {
  fileId: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  status: 'uploaded' | 'failed';
  error?: string;
}

interface UploadResponse {
  success: boolean;
  spec: {
    id: string;
    name: string;
    supplierName?: string;
    description?: string;
    primaryFunction?: string;
    category?: string;
  };
  files: UploadedFile[];
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  processingStatus: string;
}

export default function UploadPage() {
  const [specName, setSpecName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!specName.trim()) {
      setError('Spec name is required');
      return;
    }

    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('specName', specName.trim());

      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResponse(result);
        setSpecName('');
        setFiles([]);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (error) {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf'))
      return <FileText className="w-5 h-5 text-red-400" />;
    if (type.includes('image'))
      return <FileText className="w-5 h-5 text-blue-400" />;
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  if (uploadResponse) {
    return (
      <div className="min-h-screen bg-[url(/images/dark-background.webp)] bg-cover bg-top-right bg-fixed">
        <div className="min-h-screen bg-black/20 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-green-500/30">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Upload Successful!
              </h1>
              <p className="text-gray-300 text-lg">
                Your files have been uploaded and processing has started
              </p>
            </div>

            {/* Spec Info Card */}
            <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-400" />
                  {uploadResponse.spec.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-400">
                      {uploadResponse.totalFiles}
                    </div>
                    <div className="text-sm text-gray-300">Total Files</div>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="text-2xl font-bold text-green-400">
                      {uploadResponse.successfulUploads}
                    </div>
                    <div className="text-sm text-gray-300">Successful</div>
                  </div>
                  <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <div className="text-2xl font-bold text-orange-400">
                      {uploadResponse.failedUploads}
                    </div>
                    <div className="text-sm text-gray-300">Failed</div>
                  </div>
                </div>

                {/* Files List */}
                <div className="space-y-3 mb-6">
                  {uploadResponse.files.map((file) => (
                    <div
                      key={file.fileId}
                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <div className="font-medium text-white">
                            {file.filename}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'uploaded' ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <Clock className="w-5 h-5 text-orange-400" />
                          </>
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status Alert */}
                <Alert className="bg-blue-500/10 border-blue-500/20 mb-6">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-200">
                    <strong>Processing Status:</strong>{' '}
                    {uploadResponse.processingStatus}
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => setUploadResponse(null)}
                    variant="outline"
                    className="bg-zinc-800/50 border-zinc-600 text-white hover:bg-zinc-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload More Files
                  </Button>
                  <Button
                    onClick={() => {
                      window.location.href = '/search';
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Documents
                  </Button>
                  <Button
                    onClick={() => {
                      window.location.href = '/specs';
                    }}
                    variant="outline"
                    className="bg-zinc-800/50 border-zinc-600 text-white hover:bg-zinc-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Specs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url(/images/dark-background.webp)] bg-cover bg-top-right bg-fixed">
      <div className="min-h-screen bg-black/20 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            className="text-gray-300 hover:text-white hover:bg-zinc-800/50 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-blue-500/30">
              <Package className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Upload Supplier Specification
            </h1>
            <p className="text-gray-300 text-lg">
              Upload documents for a specific ingredient specification
            </p>
          </div>

          {/* Upload Form */}
          <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Spec Name Input */}
                <div className="space-y-3">
                  <Label
                    htmlFor="specName"
                    className="text-lg font-medium text-white"
                  >
                    Specification Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="specName"
                    value={specName}
                    onChange={(e) => setSpecName(e.target.value)}
                    placeholder="e.g., Organic Vanilla Extract - XYZ Corp"
                    className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-gray-400 text-lg p-4"
                    required
                  />
                  <p className="text-sm text-gray-400">
                    If this spec name already exists, files will be added to the
                    existing spec
                  </p>
                </div>

                {/* File Upload Area */}
                <div className="space-y-4">
                  <Label className="text-lg font-medium text-white">
                    Upload Documents
                  </Label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                      isDragActive
                        ? 'border-blue-400 bg-blue-500/10'
                        : 'border-zinc-600 hover:border-blue-500 hover:bg-blue-500/5'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto w-16 h-16 text-gray-400 mb-4" />
                    {isDragActive ? (
                      <p className="text-blue-400 text-lg font-medium">
                        Drop the files here...
                      </p>
                    ) : (
                      <>
                        <p className="text-white font-medium mb-2 text-lg">
                          Drag and drop files here, or click to select files
                        </p>
                        <p className="text-gray-400">
                          Supported formats: PDF, JPEG, PNG, TXT (max 50MB each)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Selected Files */}
                {files.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-lg font-medium text-white">
                      Selected Files ({files.length})
                    </Label>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {files.map((file) => (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30"
                        >
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.type)}
                            <div>
                              <div className="font-medium text-white">
                                {file.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeFile(files.indexOf(file))}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <Alert className="bg-red-500/10 border-red-500/20">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={
                    isUploading || !specName.trim() || files.length === 0
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 text-lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Upload {files.length} File{files.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
