import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Download,
  Send,
  Calendar,
  User,
  Receipt,
  DollarSign,
  Trash2
} from 'lucide-react';
import { useDeleteProforma } from '@/hooks/useProforma';
import { usePermissionGuards } from '@/hooks/usePermissionGuards';
import { externalApiAdapter } from '@/integrations/database/external-api-adapter';

interface ProformaItem {
  id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_percentage: number;
  tax_amount: number;
  line_total: number;
}

interface Proforma {
  id: string;
  proforma_number: string;
  proforma_date: string;
  valid_until: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  terms_and_conditions?: string;
  customers?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  proforma_items?: ProformaItem[];
}

interface ViewProformaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proforma: Proforma | null;
  onDownloadPDF?: (proforma: Proforma) => void;
  onSendEmail?: (proforma: Proforma) => void;
  onCreateInvoice?: (proforma: Proforma) => void;
  onDelete?: () => void;
  companyId?: string;
}

export const ViewProformaModal = ({
  open,
  onOpenChange,
  proforma,
  onDownloadPDF,
  onSendEmail,
  onCreateInvoice,
  onDelete,
  companyId
}: ViewProformaModalProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loadedProforma, setLoadedProforma] = useState<Proforma | null>(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const deleteProforma = useDeleteProforma(companyId);
  const { canDeleteUI } = usePermissionGuards();
  const canDelete = canDeleteUI('proforma');

  // Load proforma items when modal opens or proforma changes
  useEffect(() => {
    if (!open || !proforma?.id) {
      setLoadedProforma(proforma || null);
      return;
    }

    const loadProformaWithItems = async () => {
      try {
        setIsLoadingItems(true);
        // Fetch proforma items
        const itemsResult = await externalApiAdapter.selectBy('proforma_items', { proforma_id: proforma.id });

        if (!itemsResult.error && itemsResult.data) {
          // Enrich items with product names if available
          const enrichedItems = itemsResult.data.map((item: any) => ({
            ...item,
            product_name: item.product_name || item.products?.name || 'Unknown Product'
          }));

          setLoadedProforma({
            ...proforma,
            proforma_items: enrichedItems
          });
        } else {
          setLoadedProforma(proforma);
        }
      } catch (error) {
        console.error('Error loading proforma items:', error);
        setLoadedProforma(proforma);
      } finally {
        setIsLoadingItems(false);
      }
    };

    loadProformaWithItems();
  }, [open, proforma?.id]);

  if (!proforma) return null;

  // Use loaded proforma with items if available, otherwise fall back to original
  const displayProforma = loadedProforma || proforma;

  const handleDeleteConfirm = async () => {
    try {
      await deleteProforma.mutateAsync(proforma.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
      onDelete?.();
    } catch (error) {
      console.error('Error deleting proforma:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      case 'accepted':
        return <Badge variant="destructive">Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      case 'converted':
        return <Badge variant="destructive">Converted to Invoice</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownload = () => {
    onDownloadPDF?.(displayProforma);
  };

  const handleSendEmail = () => {
    onSendEmail?.(displayProforma);
  };

  const handleCreateInvoice = () => {
    onCreateInvoice?.(displayProforma);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Proforma Invoice #{displayProforma.proforma_number}
          </DialogTitle>
          <DialogDescription>
            View proforma invoice details and perform actions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Proforma Details
                </CardTitle>
                {getStatusBadge(displayProforma.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Proforma Number</p>
                  <p className="text-sm">{displayProforma.proforma_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(displayProforma.proforma_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valid Until</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(displayProforma.valid_until)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-sm flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${Number(displayProforma.total_amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {displayProforma.customers && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{displayProforma.customers.name}</p>
                  {displayProforma.customers.email && (
                    <p className="text-sm text-muted-foreground">{displayProforma.customers.email}</p>
                  )}
                  {displayProforma.customers.phone && (
                    <p className="text-sm text-muted-foreground">{displayProforma.customers.phone}</p>
                  )}
                  {displayProforma.customers.address && (
                    <p className="text-sm text-muted-foreground">{displayProforma.customers.address}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingItems ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : displayProforma.proforma_items && displayProforma.proforma_items.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Tax %</TableHead>
                        <TableHead className="text-right">Tax Amount</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayProforma.proforma_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product_name || 'Unknown Product'}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${Number(item.unit_price || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.tax_percentage}%</TableCell>
                          <TableCell className="text-right">${Number(item.tax_amount || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${Number(item.line_total || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Separator className="my-4" />

                  {/* Totals */}
                  <div className="space-y-2 max-w-sm ml-auto">
                    <div className="flex justify-between">
                      <span className="text-sm">Subtotal:</span>
                      <span className="text-sm">${Number(displayProforma.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Tax:</span>
                      <span className="text-sm">${Number(displayProforma.tax_amount || 0).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${Number(displayProforma.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No line items found for this proforma</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(displayProforma.notes || displayProforma.terms_and_conditions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayProforma.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {displayProforma.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
              {displayProforma.terms_and_conditions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Terms & Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {displayProforma.terms_and_conditions}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleSendEmail}>
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            {displayProforma.status !== 'converted' && (
              <Button
                onClick={handleCreateInvoice}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Convert to Invoice
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Proforma Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete proforma invoice {displayProforma.proforma_number}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogAction
          onClick={handleDeleteConfirm}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          disabled={deleteProforma.isPending}
        >
          {deleteProforma.isPending ? 'Deleting...' : 'Delete'}
        </AlertDialogAction>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
