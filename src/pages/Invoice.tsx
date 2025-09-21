import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Printer, Car, ArrowLeft, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { EditInvoiceModal } from '@/components/EditInvoiceModal';

interface InvoiceData {
  invoice_number: string;
  created_at: string;
  status: string;
  job: {
    id: string;
    description: string;
    cost: number;
    status: string;
    notes: string;
    customer: {
      name: string;
      phone: string;
      email: string;
    };
    vehicle: {
      registration: string;
      model: string;
      type: string;
    };
    assigned_employee: {
      username: string;
      user_id: string;
    };
  };
}

export default function Invoice() {
  const { jobId } = useParams<{ jobId: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (jobId) {
      fetchInvoice();
    }
  }, [jobId]);

  const fetchInvoice = async () => {
    if (!jobId) return;

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        invoice_number,
        created_at,
        status,
        job:jobs (
          id,
          description,
          cost,
          status,
          notes,
          customer:customers (
            name,
            phone,
            email
          ),
          vehicle:vehicles (
            registration,
            model,
            type
          ),
          assigned_employee:profiles (
            username,
            user_id
          )
        )
      `)
      .eq('job_id', jobId)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
    } else {
      setInvoice(data);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout title="Invoice">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout title="Invoice">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Invoice not found</h2>
          <p className="text-muted-foreground mt-2">The requested invoice could not be found.</p>
        </div>
      </Layout>
    );
  }

  const job = invoice.job;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout title={`Invoice ${invoice.invoice_number}`}>
      <div className="max-w-4xl mx-auto">
        {/* Navigation and Print actions */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            {profile?.role === 'admin' && (
              <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Invoice
              </Button>
            )}
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Invoice */}
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary p-3 rounded-full">
                <Car className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Lumak Motors</CardTitle>
            <p className="text-muted-foreground">Professional Automotive Services</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Invoice Details</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Invoice #:</strong> {invoice.invoice_number}</p>
                  <p><strong>Date:</strong> {formatDate(invoice.created_at)}</p>
                  <p><strong>Job ID:</strong> {job.id.substring(0, 8)}</p>
                  <p><strong>Technician:</strong> {job.assigned_employee.username}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Bill To</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{job.customer.name}</p>
                  {job.customer.phone && <p>{job.customer.phone}</p>}
                  {job.customer.email && <p>{job.customer.email}</p>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Vehicle Information */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <p><strong>Registration:</strong> {job.vehicle.registration}</p>
                <p><strong>Model:</strong> {job.vehicle.model}</p>
                <p><strong>Type:</strong> {job.vehicle.type}</p>
              </div>
            </div>

            <Separator />

            {/* Service Details */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Service Details</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <p><strong>Description:</strong></p>
                  <p className="mt-1 p-3 bg-muted rounded-md">{job.description}</p>
                </div>
                
                {job.notes && (
                  <div className="text-sm">
                    <p><strong>Notes:</strong></p>
                    <p className="mt-1 p-3 bg-muted rounded-md">{job.notes}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm">
                    <strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      job.status === 'completed' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-end">
              <div className="text-right">
                <div className="flex items-center space-x-8">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">
                    Ksh {job.cost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground pt-6 border-t">
              <p>Thank you for choosing Lumak Motors!</p>
              <p className="mt-1">For any questions regarding this invoice, please contact us.</p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Invoice Modal */}
        <EditInvoiceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          jobId={jobId!}
          onInvoiceSaved={fetchInvoice}
        />
      </div>
    </Layout>
  );
}