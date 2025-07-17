import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Upload,
  Search,
  FileText,
  Database,
  BarChart3,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Supplier Specification Intelligence Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced document processing and intelligent search for supplier
            specifications. Upload, analyze, and discover insights from your
            ingredient documentation.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-lg">Upload Specs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Upload multiple documents per specification with intelligent
                processing
              </CardDescription>
              <Link href="/upload">
                <Button className="w-full">Start Uploading</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-green-600" />
                <CardTitle className="text-lg">Manage Specs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                View and manage all your supplier specifications in one place
              </CardDescription>
              <Link href="/specs">
                <Button className="w-full" variant="outline">
                  View Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Search className="h-8 w-8 text-purple-600" />
                <CardTitle className="text-lg">Search Specs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Intelligent search across all specifications with natural
                language
              </CardDescription>
              <Link href="/search">
                <Button className="w-full" variant="outline">
                  Search Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Sample Queries */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Try These Intelligent Queries
            </CardTitle>
            <CardDescription>
              Get started with these example searches to discover what our AI
              can find
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">
                  Allergen & Safety
                </h4>
                <div className="space-y-2">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm font-medium">
                      &quot;Find all gluten-free specifications&quot;
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium">
                      &quot;Which ingredients contain dairy allergens?&quot;
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm font-medium">
                      &quot;Show me all organic certified ingredients&quot;
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">
                  Nutritional & Technical
                </h4>
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium">
                      &quot;High protein ingredients above 20%&quot;
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium">
                      &quot;What&apos;s the shelf life of vanilla extract?&quot;
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-medium">
                      &quot;Find emulsifiers for ice cream applications&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">
                  Smart Document Processing
                </h4>
                <p className="text-sm text-gray-600">
                  Automatically extracts allergens, nutritional data, and
                  technical specifications
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Semantic Search</h4>
                <p className="text-sm text-gray-600">
                  Find information by meaning, not just keywords. Ask questions
                  naturally.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Advanced Analytics</h4>
                <p className="text-sm text-gray-600">
                  Track compliance, analyze trends, and get insights from your
                  specifications
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
