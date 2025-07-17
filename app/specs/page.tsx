'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Building,
  FileText,
  Search,
  Filter,
  Eye,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Users,
  Database,
  ArrowLeft,
} from 'lucide-react';

interface Spec {
  id: string;
  name: string;
  supplierName: string;
  description: string;
  primaryFunction: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastProcessedAt: string;
  fileCount: number;
  totalSizeBytes: string;
  metadata?: any;
}

interface SpecsResponse {
  specs: Spec[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  statistics: {
    totalSpecs: number;
    totalFiles: number;
    totalChunks: number;
    processingStats: {
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    };
  };
  filters: {
    supplierName?: string;
    category?: string;
    isActive: boolean;
  };
}

export default function SpecsPage() {
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statistics, setStatistics] = useState<any>(null);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchSpecs();
  }, [searchTerm, selectedSupplier, selectedCategory]);

  const fetchSpecs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
        includeMetadata: 'true',
      });

      if (selectedSupplier) params.append('supplierName', selectedSupplier);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/specs?${params}`);
      const data: SpecsResponse = await response.json();

      if (response.ok) {
        setSpecs(data.specs);
        setStatistics(data.statistics);
        setPagination(data.pagination);
      } else {
        setError('Failed to fetch specifications');
      }
    } catch (err) {
      setError('Failed to fetch specifications');
    } finally {
      setLoading(false);
    }
  };

  const filteredSpecs = specs.filter(
    (spec) =>
      spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatFileSize = (bytes: string) => {
    const size = Number.parseInt(bytes);
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return `${Number.parseFloat((size / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getProcessingStatus = (spec: Spec) => {
    if (spec.fileCount === 0) return 'no-files';
    if (spec.lastProcessedAt) return 'processed';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-400" />;
      case 'no-files':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processed':
        return 'Processed';
      case 'pending':
        return 'Processing';
      case 'no-files':
        return 'No Files';
      default:
        return 'Failed';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'no-files':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-red-500/20 text-red-300 border-red-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[url(/images/dark-background.webp)] bg-cover bg-top-right bg-fixed">
        <div className="min-h-screen bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading specifications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[url(/images/dark-background.webp)] bg-cover bg-top-right bg-fixed">
        <div className="min-h-screen bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Card className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-300 font-medium">{error}</p>
                <Button
                  onClick={fetchSpecs}
                  variant="outline"
                  className="mt-4 bg-zinc-800/50 border-zinc-600 text-white hover:bg-zinc-700"
                >
                  Try Again
                </Button>
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
        <div className="max-w-7xl mx-auto px-4 py-8">
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
              <Database className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Supplier Specifications
            </h1>
            <p className="text-gray-300 text-lg">
              Manage and explore your ingredient specifications
            </p>
            <Button
              onClick={() => {
                window.location.href = '/upload';
              }}
              className="mt-6 bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Spec
            </Button>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Specs</p>
                      <p className="text-2xl font-bold text-white">
                        {statistics.totalSpecs}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Files</p>
                      <p className="text-2xl font-bold text-white">
                        {statistics.totalFiles}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Search Chunks</p>
                      <p className="text-2xl font-bold text-white">
                        {statistics.totalChunks}
                      </p>
                    </div>
                    <Database className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Processing</p>
                      <p className="text-2xl font-bold text-white">
                        {statistics.processingStats.pending +
                          statistics.processingStats.processing}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filters */}
          <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <Input
                      placeholder="Search specifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-zinc-800/50 border-zinc-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-zinc-800/50 border-zinc-600 text-white"
                  >
                    <option value="">All Suppliers</option>
                    {[
                      ...new Set(
                        specs.map((s) => s.supplierName).filter(Boolean),
                      ),
                    ].map((supplier) => (
                      <option key={supplier} value={supplier}>
                        {supplier}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-zinc-800/50 border-zinc-600 text-white"
                  >
                    <option value="">All Categories</option>
                    {[
                      ...new Set(specs.map((s) => s.category).filter(Boolean)),
                    ].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpecs.map((spec) => {
              const status = getProcessingStatus(spec);

              return (
                <Card
                  key={spec.id}
                  className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm hover:bg-zinc-900/90 transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-white mb-1">
                          {spec.name}
                        </CardTitle>
                        {spec.supplierName && (
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Building className="w-4 h-4" />
                            {spec.supplierName}
                          </div>
                        )}
                      </div>
                      <Badge
                        className={`border ${getStatusColor(status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(status)}
                        {getStatusText(status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {spec.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {spec.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {spec.primaryFunction && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-300">
                            Function:
                          </span>
                          <span className="text-gray-400">
                            {spec.primaryFunction}
                          </span>
                        </div>
                      )}
                      {spec.category && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-300">
                            Category:
                          </span>
                          <span className="text-gray-400">{spec.category}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {spec.fileCount} files
                      </div>
                      <div>{formatFileSize(spec.totalSizeBytes)}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-zinc-800/50 border-zinc-600 text-white hover:bg-zinc-700"
                        onClick={() => {
                          window.location.href = `/specs/${spec.id}`;
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-zinc-800/50 border-zinc-600 text-white hover:bg-zinc-700"
                        onClick={() => {
                          window.location.href = `/search?spec=${encodeURIComponent(spec.name)}`;
                        }}
                      >
                        <Search className="w-4 h-4 mr-1" />
                        Search
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredSpecs.length === 0 && (
            <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No specifications found
                </h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm || selectedSupplier || selectedCategory
                    ? 'Try adjusting your search criteria or filters'
                    : 'Get started by uploading your first supplier specification'}
                </p>
                <Button
                  onClick={() => {
                    window.location.href = '/upload';
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Spec
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
