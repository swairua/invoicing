import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { generateCustomerStatementPDF } from '@/utils/pdfGenerator';
import { exportCustomerStatementsToCSV, exportCustomerStatementsToExcel, exportCustomerStatementSummaryToCSV } from '@/utils/csvExporter';
import { toast } from 'sonner';
import { logCustomerStatement } from '@/utils/auditLogger';
import { useCurrentCompany } from '@/contexts/CompanyContext';
import { useCustomers, usePayments } from '@/hooks/useDatabase';
import { useInvoicesFixed as useInvoices } from '@/hooks/useInvoicesFixed';
import { useCreditNotes } from '@/hooks/useCreditNotes';
import CustomerStatementPreviewModal from '@/components/statements/CustomerStatementPreviewModal';

const computeCustomerStatements = (customers: any[], invoices: any[], payments: any[], creditNotes: any[] = []) => {
  if (!customers || !invoices || !payments) return [];

  return customers.map(customer => {
    const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id);
    const customerInvoiceIds = customerInvoices.map(inv => inv.id);
    const customerPayments = payments.filter(pay => customerInvoiceIds.includes(pay.invoice_id));
    const customerCreditNotes = creditNotes.filter(cn => cn.customer_id === customer.id);

    const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
    const totalPaid = customerPayments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
    const totalCredited = customerCreditNotes.reduce((sum, cn) => sum + (Number(cn.total_amount) || 0), 0);
    const currentBalance = totalInvoiced - totalPaid - totalCredited;

    const today = new Date();
    let current = 0, days30 = 0, days60 = 0, days90 = 0;

    customerInvoices.forEach(invoice => {
      const dueDate = new Date(invoice.due_date || invoice.invoice_date);
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const unpaidAmount = Number(invoice.total_amount) - Number(invoice.paid_amount || 0);

      if (daysPastDue <= 0) current += unpaidAmount;
      else if (daysPastDue <= 30) days30 += unpaidAmount;
      else if (daysPastDue <= 60) days60 += unpaidAmount;
      else days90 += unpaidAmount;
    });

    const overdueAmount = days30 + days60 + days90;

    const allTransactions = [
      ...customerInvoices.map(inv => ({
        date: inv.invoice_date,
        type: 'Invoice',
        reference: inv.invoice_number,
        description: `Invoice - ${inv.invoice_number}`,
        debit: Number(inv.total_amount) || 0,
        credit: 0,
        balance: 0
      })),
      ...customerPayments.map(pay => ({
        date: pay.payment_date,
        type: 'Payment',
        reference: pay.payment_number,
        description: `Payment - ${pay.payment_method || 'Cash'}`,
        debit: 0,
        credit: Number(pay.amount) || 0,
        balance: 0
      })),
      ...customerCreditNotes.map(cn => ({
        date: cn.credit_note_date,
        type: 'Credit Note',
        reference: cn.credit_note_number,
        description: `Credit Note - ${cn.credit_note_number}${cn.reason ? ` (${cn.reason})` : ''}`,
        debit: 0,
        credit: Number(cn.total_amount) || 0,
        balance: 0
      }))
    ];

    allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = 0;
    allTransactions.forEach(trans => {
      runningBalance += trans.debit - trans.credit;
      trans.balance = runningBalance;
    });

    return {
      customerId: customer.id,
      customerName: customer.name,
      customerCode: customer.customer_code,
      address: customer.address || '',
      email: customer.email || '',
      phone: customer.phone || '',
      creditLimit: Number(customer.credit_limit) || 0,
      currentBalance: currentBalance,
      overdueAmount: overdueAmount,
      lastStatementDate: new Date().toISOString().split('T')[0],
      transactions: allTransactions.slice(-10),
      agingAnalysis: {
        current: current,
        days30: days30,
        days60: days60,
        days90: days90,
        over90: days90,
        total: current + days30 + days60 + days90
      },
      invoiceCount: customerInvoices.length,
      lastPaymentDate: customerPayments.length > 0
        ? customerPayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]?.payment_date
        : undefined,
      lastPaymentAmount: customerPayments.length > 0
        ? customerPayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]?.amount
        : undefined,
    };
  });
};

const StatementOfAccounts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [drillDownCustomer, setDrillDownCustomer] = useState<any>(null);

  const { currentCompany } = useCurrentCompany();
  const { data: customers } = useCustomers(currentCompany?.id);
  const { data: invoices } = useInvoices(currentCompany?.id);
  const { data: payments } = usePayments(currentCompany?.id);
  const { data: creditNotes } = useCreditNotes(currentCompany?.id);

  const computedStatements = computeCustomerStatements(customers || [], invoices || [], payments || [], creditNotes || []);

  const filteredStatements = computedStatements.filter(statement => {
    const matchesSearch = statement.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(statement.customerCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = selectedCustomer === 'all' || statement.customerId.toString() === selectedCustomer;
    const matchesOverdue = !showOverdueOnly || statement.overdueAmount > 0;
    return matchesSearch && matchesCustomer && matchesOverdue;
  });

  const statementDate = new Date().toISOString().split('T')[0];

  const getStatementRecordIds = (statement: { customerId: string }) => {
    const customerInvoices = invoices?.filter(inv => inv.customer_id === statement.customerId) || [];
    const invoiceIds = customerInvoices.map(inv => inv.id);
    const customerPayments = payments?.filter(pay => invoiceIds.includes(pay.invoice_id)) || [];
    const customerCreditNotes = creditNotes?.filter(cn => cn.customer_id === statement.customerId) || [];

    return {
      invoiceIds,
      paymentIds: customerPayments.map(pay => pay.id),
      creditNoteIds: customerCreditNotes.map(cn => cn.id),
    };
  };

  const exportData = filteredStatements.map(s => ({
    customer_id: s.customerId,
    customer_name: s.customerName,
    customer_email: s.email,
    total_outstanding: s.currentBalance,
    current_due: s.agingAnalysis.current,
    overdue_amount: s.overdueAmount,
    days_overdue: 0,
    last_payment_date: s.lastPaymentDate,
    last_payment_amount: s.lastPaymentAmount,
    invoice_count: s.invoiceCount,
  }));

  const auditExport = (format: 'csv' | 'summary_csv' | 'xlsx') => {
    void Promise.all(filteredStatements.map(statement => {
      const customer = customers?.find(c => c.id === statement.customerId);
      return customer
        ? logCustomerStatement(customer, currentCompany?.id, statementDate, format, getStatementRecordIds(statement), true)
        : Promise.resolve();
    }));
  };

  const handleDownloadStatement = async (statement: { customerId: string; customerName: string }) => {
    const customer = customers?.find(c => c.id === statement.customerId);
    try {
      if (!customer) {
        toast.error('Customer not found in database');
        return;
      }

      const customerInvoices = invoices?.filter(inv => inv.customer_id === customer.id) || [];
      const invoiceIds = customerInvoices.map(inv => inv.id);
      const customerPayments = payments?.filter(pay => invoiceIds.includes(pay.invoice_id)) || [];
      const customerCreditNotes = creditNotes?.filter(cn => cn.customer_id === customer.id) || [];

      const companyDetails = currentCompany ? {
        name: currentCompany.name,
        address: currentCompany.address,
        city: currentCompany.city,
        country: currentCompany.country,
        phone: currentCompany.phone,
        email: currentCompany.email,
        tax_number: currentCompany.tax_number,
        logo_url: currentCompany.logo_url,
        primary_color: currentCompany.primary_color,
        pdf_template: currentCompany.pdf_template
      } : undefined;

      await generateCustomerStatementPDF(customer, customerInvoices, customerPayments, customerCreditNotes, {
        statement_date: statementDate
      }, companyDetails);
      await logCustomerStatement(customer, currentCompany?.id, statementDate, 'pdf', {
        invoiceIds,
        paymentIds: customerPayments.map(pay => pay.id),
        creditNoteIds: customerCreditNotes.map(cn => cn.id),
      }, true);

      toast.success(`Statement PDF generated for ${statement.customerName}`);
    } catch (error) {
      console.error('Error generating statement PDF:', error);
      if (customer) {
        await logCustomerStatement(customer, currentCompany?.id, statementDate, 'pdf', getStatementRecordIds(statement), false);
      }
      toast.error('Failed to generate statement PDF. Please try again.');
    }
  };

  const handleBulkExport = () => {
    exportCustomerStatementsToCSV(exportData);
    auditExport('csv');
    toast.success(`Exported ${exportData.length} customer statements to CSV`);
  };

  const handleExcelExport = () => {
    exportCustomerStatementsToExcel(exportData);
    auditExport('xlsx');
    toast.success(`Exported ${exportData.length} customer statements to Excel`);
  };

  const getStatusInfo = (currentBalance: number, overdueAmount: number, creditLimit: number) => {
    if (overdueAmount > 0) {
      return { label: 'Overdue', color: 'bg-destructive text-destructive-foreground' };
    } else if (currentBalance > creditLimit * 0.8) {
      return { label: 'Near Limit', color: 'bg-warning text-warning-foreground' };
    } else {
      return { label: 'Good', color: 'bg-success text-success-foreground' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalOutstanding = filteredStatements.reduce((sum, s) => sum + s.currentBalance, 0);
  const totalOverdue = filteredStatements.reduce((sum, s) => sum + s.overdueAmount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Statement of Accounts</h1>
          <p className="text-muted-foreground">Customer account statements and aging analysis</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleBulkExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExcelExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => {
            exportCustomerStatementSummaryToCSV(exportData);
            auditExport('summary_csv');
            toast.success('Summary exported to CSV');
          }}>
            <FileText className="mr-2 h-4 w-4" />
            Summary
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">KES</span>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totalOutstanding)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Amount</p>
                <p className="text-lg font-bold text-destructive">{formatCurrency(totalOverdue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Customers</p>
                <p className="text-lg font-bold text-success">{filteredStatements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Customers</p>
                <p className="text-lg font-bold text-warning">
                  {computedStatements.filter(s => s.overdueAmount > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Filter Customer Statements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {computedStatements.filter(s => s.customerId).map((statement) => (
                  <SelectItem key={statement.customerId} value={statement.customerId.toString()}>
                    {statement.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showOverdueOnly ? "default" : "outline"}
              onClick={() => setShowOverdueOnly(!showOverdueOnly)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Overdue Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Statements Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Customer Account Statements</CardTitle>
          <CardDescription>
            Click a customer row to view detailed statement with full transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStatements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No customer statements found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCustomer !== 'all' || showOverdueOnly
                  ? 'Try adjusting your search criteria'
                  : 'No customer statements available'
                }
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">1-30d</TableHead>
                    <TableHead className="text-right">31-60d</TableHead>
                    <TableHead className="text-right">61-90d</TableHead>
                    <TableHead className="text-right">90+d</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStatements.map((s) => {
                    const statusInfo = getStatusInfo(s.currentBalance, s.overdueAmount, s.creditLimit);
                    return (
                      <TableRow
                        key={s.customerId}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setDrillDownCustomer(s)}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium">{s.customerName}</p>
                              <p className="text-xs text-muted-foreground">{s.customerCode}{s.email ? ` • ${s.email}` : ''}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(s.currentBalance)}</TableCell>
                        <TableCell className="text-right text-success">{formatCurrency(s.agingAnalysis.current)}</TableCell>
                        <TableCell className="text-right text-warning">{formatCurrency(s.agingAnalysis.days30)}</TableCell>
                        <TableCell className="text-right text-orange-600">{formatCurrency(s.agingAnalysis.days60)}</TableCell>
                        <TableCell className="text-right text-destructive">{formatCurrency(s.agingAnalysis.days90)}</TableCell>
                        <TableCell className="text-right text-destructive font-medium">{formatCurrency(s.overdueAmount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDownloadStatement(s); }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {/* Totals footer */}
              <div className="border-t px-4 py-3 bg-muted/20">
                <div className="flex justify-end space-x-8 text-sm font-medium">
                  <span>Total Customers: <strong>{filteredStatements.length}</strong></span>
                  <span>Outstanding: <strong className="text-primary">{formatCurrency(totalOutstanding)}</strong></span>
                  <span>Overdue: <strong className="text-destructive">{formatCurrency(totalOverdue)}</strong></span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Drill-down Modal */}
      {drillDownCustomer && (
        <CustomerStatementPreviewModal
          isOpen={!!drillDownCustomer}
          onClose={() => setDrillDownCustomer(null)}
          customer={{
            customer_id: drillDownCustomer.customerId,
            customer_name: drillDownCustomer.customerName,
            customer_email: drillDownCustomer.email,
            total_outstanding: drillDownCustomer.currentBalance,
            current_due: drillDownCustomer.agingAnalysis.current,
            overdue_amount: drillDownCustomer.overdueAmount,
            days_overdue: drillDownCustomer.overdueAmount > 0 ? 1 : 0,
            last_payment_date: drillDownCustomer.lastPaymentDate,
            last_payment_amount: drillDownCustomer.lastPaymentAmount,
            invoice_count: drillDownCustomer.invoiceCount,
          }}
          statementDate={new Date().toISOString().split('T')[0]}
        />
      )}
    </div>
  );
};

export default StatementOfAccounts;
