import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { runTokenDiagnostics, logTokenDiagnostics } from '@/utils/tokenDiagnostics';
import type { TokenDiagnostics } from '@/utils/tokenDiagnostics';

export default function TokenDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<TokenDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = () => {
    setIsLoading(true);
    try {
      const result = runTokenDiagnostics();
      setDiagnostics(result);
      logTokenDiagnostics(); // Also log to console
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  if (!diagnostics) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Token Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={runDiagnostics} disabled={isLoading}>
                {isLoading ? 'Running...' : 'Run Diagnostics'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasIssues = diagnostics.issues.length > 0;
  const isValid = diagnostics.tokenFormat === 'valid_jwt' && !hasIssues;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">🔐 Token Diagnostics</h1>
          <Button
            onClick={runDiagnostics}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Running...' : 'Refresh'}
          </Button>
        </div>

        {/* Overall Status */}
        <Card className={`border-2 ${isValid ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {isValid ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <span>Token Status: Valid</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <span>Token Status: Issues Found</span>
                  </>
                )}
              </CardTitle>
              <span className="text-sm text-gray-500">
                {new Date(diagnostics.timestamp).toLocaleString()}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Token Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Token Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="mt-1">
                  <Badge variant={diagnostics.tokenPresent ? 'default' : 'secondary'}>
                    {diagnostics.tokenPresent ? 'Present' : 'Missing'}
                  </Badge>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Format</label>
                <p className="mt-1 font-mono text-sm">
                  {diagnostics.tokenFormat === 'valid_jwt' ? (
                    <Badge variant="default">Valid JWT</Badge>
                  ) : diagnostics.tokenFormat === 'invalid_format' ? (
                    <Badge variant="destructive">Invalid Format</Badge>
                  ) : (
                    <Badge variant="secondary">Missing</Badge>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Length</label>
                <p className="mt-1 font-mono">{diagnostics.tokenLength} characters</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Preview</label>
                <p className="mt-1 font-mono text-xs bg-gray-100 p-2 rounded break-all">
                  {diagnostics.tokenPreview}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiration Information */}
        {diagnostics.tokenPresent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expiration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Has Expiration</label>
                  <p className="mt-1">
                    <Badge variant={diagnostics.tokenExpiration.hasExp ? 'default' : 'secondary'}>
                      {diagnostics.tokenExpiration.hasExp ? 'Yes' : 'No'}
                    </Badge>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="mt-1">
                    <Badge
                      variant={
                        diagnostics.tokenExpiration.isExpired ? 'destructive' : 'default'
                      }
                    >
                      {diagnostics.tokenExpiration.isExpired ? 'Expired' : 'Active'}
                    </Badge>
                  </p>
                </div>

                {diagnostics.tokenExpiration.expiresAt && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Expires At</label>
                      <p className="mt-1 font-mono text-sm">
                        {new Date(diagnostics.tokenExpiration.expiresAt).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Time Remaining</label>
                      <p className="mt-1 font-mono text-sm">
                        {diagnostics.tokenExpiration.timeRemaining || '(expired)'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">User ID</label>
                <p className="mt-1">
                  <Badge variant={diagnostics.userIdPresent ? 'default' : 'secondary'}>
                    {diagnostics.userIdPresent ? 'Present' : 'Missing'}
                  </Badge>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">User Email</label>
                <p className="mt-1">
                  <Badge variant={diagnostics.userEmailPresent ? 'default' : 'secondary'}>
                    {diagnostics.userEmailPresent ? 'Present' : 'Missing'}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium text-gray-600">localStorage Access</label>
              <p className="mt-1">
                <Badge variant={diagnostics.storageAccessible ? 'default' : 'destructive'}>
                  {diagnostics.storageAccessible ? 'Accessible' : 'Not Accessible'}
                </Badge>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Issues */}
        {diagnostics.issues.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-orange-900">
                <AlertTriangle className="h-5 w-5" />
                Issues Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {diagnostics.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span className="text-orange-900">{issue}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {diagnostics.recommendations.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {diagnostics.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">→</span>
                    <span className="text-blue-900">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => {
                localStorage.clear();
                alert('localStorage cleared. Please refresh the page.');
              }}
              variant="outline"
              className="w-full"
            >
              Clear localStorage
            </Button>

            <Button
              onClick={() => {
                window.location.href = '/login';
              }}
              variant="outline"
              className="w-full"
            >
              Go to Login
            </Button>

            <Button
              onClick={() => {
                window.location.reload();
              }}
              variant="outline"
              className="w-full"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
