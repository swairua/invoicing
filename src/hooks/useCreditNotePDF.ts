import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generateCreditNotePDF, type CreditNotePDFData, type CompanyData } from '@/utils/creditNotePdfGenerator';
import { useCurrentCompany } from '@/contexts/CompanyContext';

export function useCreditNotePDFDownload() {
  const { currentCompany } = useCurrentCompany();

  return useMutation({
    mutationFn: async (creditNote: CreditNotePDFData) => {
      // Prepare company data
      const companyData: CompanyData = {
        name: currentCompany?.name || 'Your Company',
        email: currentCompany?.email || '',
        phone: currentCompany?.phone || '',
        address: currentCompany?.address || '',
        tax_number: currentCompany?.tax_number || '',
        registration_number: currentCompany?.registration_number || '',
        logo_url: currentCompany?.logo_url || '',
        primary_color: currentCompany?.primary_color || undefined,
        currency: currentCompany?.currency || undefined,
      };

      // Generate and download PDF
      generateCreditNotePDF(creditNote, companyData);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Credit note PDF downloaded successfully!');
    },
    onError: (error: any) => {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    },
  });
}
