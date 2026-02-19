/**
 * Permission Audit Dashboard
 * Displays audit logs for permission checks, denials, and role changes
 * Admin-only component for monitoring access control
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Shield,
  Trash2,
  Download,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentCompanyId } from '@/contexts/CompanyContext';
import { apiClient } from '@/integrations/api';
import { toast } from 'sonner';

interface AuditLogEntry {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  record_id?: string;
  actor_user_id?: string;
  actor_email?: string;
  details?: any;
}

export function PermissionAuditDashboard() {
  const { isAdmin } = useAuth();
  const currentCompanyId = useCurrentCompanyId();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('denied');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('7days');

  // Fetch audit logs
  useEffect(() => {
    if (!isAdmin || !currentCompanyId) return;

    const fetchLogs = async () => {
      try {
        setLoading(true);

        // Calculate date filter
        const now = new Date();
        let fromDate = new Date();

        switch (dateFilter) {
          case '24hours':
            fromDate.setHours(now.getHours() - 24);
            break;
          case '7days':
            fromDate.setDate(now.getDate() - 7);
            break;
          case '30days':
            fromDate.setDate(now.getDate() - 30);
            break;
          case 'all':
            fromDate = new Date(0);
            break;
        }

        // Fetch from audit_logs table
        const { data, error } = await apiClient.selectBy('audit_logs', {
          company_id: currentCompanyId,
        });

        if (error) {
          console.error('Error fetching audit logs:', error);
          toast.error('Failed to load audit logs');
          setLogs([]);
          return;
        }

        // Filter logs by entity type and date
        const filtered = (data || []).filter((log: AuditLogEntry) => {
          const logDate = new Date(log.created_at);
          const matchesTab = selectedTab === 'all' || log.entity_type === selectedTab.replace('_', '');
          const matchesDate = logDate >= fromDate;
          const matchesSearch =
            log.actor_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.required_permission?.toLowerCase().includes(searchTerm.toLowerCase());

          return matchesTab && matchesDate && (searchTerm === '' || matchesSearch);
        });

        // Sort by date descending
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setLogs(filtered);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        toast.error('Failed to load audit logs');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [isAdmin, currentCompanyId, selectedTab, dateFilter, searchTerm]);

  if (!isAdmin) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <Lock className="h-5 w-5" />
            <p>You need administrator privileges to view audit logs.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Count logs by type
  const deniedCount = logs.filter(l => l.entity_type === 'permission_denied').length;
  const checksCount = logs.filter(l => l.entity_type === 'permission_check').length;
  const rolesCount = logs.filter(l => l.entity_type.includes('role')).length;

  const getActionColor = (action: string) => {
    switch (action) {
      case 'DELETE':
        return 'bg-destructive-light text-destructive';
      case 'CREATE':
        return 'bg-success-light text-success';
      case 'APPROVE':
        return 'bg-primary-light text-primary';
      default:
        return 'bg-muted-light text-muted-foreground';
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'permission_denied':
        return <AlertTriangle className="h-4 w-4" />;
      case 'permission_check':
        return <CheckCircle className="h-4 w-4" />;
      case 'role_assignment':
      case 'role':
        return <Shield className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE');
  };

  const exportLogs = () => {
    const csv = [
      ['Date', 'User', 'Action', 'Entity Type', 'Details'].join(','),
      ...logs.map(log =>
        [
          formatDate(log.created_at),
          log.actor_email || 'Unknown',
          log.action,
          log.entity_type,
          JSON.stringify(log.details || {}).replace(/,/g, ';'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Permission Audit Logs</h2>
        <p className="text-muted-foreground">
          Monitor permission checks, denials, and role assignments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Permission Denials</p>
                <p className="text-2xl font-bold text-destructive">{deniedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Permission Checks</p>
                <p className="text-2xl font-bold text-success">{checksCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role Operations</p>
                <p className="text-2xl font-bold text-primary">{rolesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by user, resource, or permission..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24hours">Last 24 hours</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={exportLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{log.actor_email || 'Unknown'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getEntityIcon(log.entity_type)}
                          <span className="text-sm capitalize">
                            {log.entity_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.details?.resource && `Resource: ${log.details.resource}`}
                        {log.details?.required_permission && (
                          <div>Required: {log.details.required_permission}</div>
                        )}
                        {log.details?.attempted_action && (
                          <div>Action: {log.details.attempted_action}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PermissionAuditDashboard;
