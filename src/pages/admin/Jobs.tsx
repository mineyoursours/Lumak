import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Car, DollarSign, Calendar, FileText, ArrowLeft, Search, Eye, Plus, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CreateInvoiceModal } from '@/components/CreateInvoiceModal';

interface Job {
  id: string;
  description: string;
  cost: number;
  status: 'pending' | 'completed';
  notes: string | null;
  created_at: string;
  customers: {
    name: string;
  };
  vehicles: {
    registration: string;
    model: string;
    type: string;
  };
  profiles: {
    username: string;
  };
  invoices: Array<{
    id: string;
    invoice_number: string;
    edit_request: string;
  }>;
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (name),
          vehicles (registration, model, type),
          profiles!jobs_assigned_employee_fkey (username),
          invoices (id, invoice_number, edit_request)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs((data as any[])?.map(job => ({
        ...job,
        invoices: Array.isArray(job.invoices) ? job.invoices : (job.invoices ? [job.invoices] : [])
      })) || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = (job: Job) => {
    setSelectedJob(job);
    setIsInvoiceModalOpen(true);
  };

  const handleInvoiceCreated = () => {
    fetchJobs();
  };

  const handleApproveEdit = async (jobId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ edit_request: 'approved' })
      .eq('job_id', jobId);

    if (error) {
      console.error('Error approving edit:', error);
      toast({
        title: "Error",
        description: "Failed to approve edit request.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Edit Approved",
        description: "Employee can now edit this invoice.",
      });
      fetchJobs();
    }
  };

  const handleRejectEdit = async (jobId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ edit_request: 'rejected' })
      .eq('job_id', jobId);

    if (error) {
      console.error('Error rejecting edit:', error);
      toast({
        title: "Error",
        description: "Failed to reject edit request.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Edit Rejected",
        description: "Edit request has been rejected.",
      });
      fetchJobs();
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.customers.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.vehicles.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingJobs = filteredJobs.filter(job => job.invoices.length === 0);
  const completedJobs = filteredJobs.filter(job => job.invoices.length > 0);

  if (loading) {
    return (
      <Layout title="Jobs">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Jobs">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
            <p className="text-muted-foreground">Manage all jobs and invoices</p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search by Job ID, Customer, Vehicle Registration..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10" 
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">
              Pending Jobs ({pendingJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed Jobs ({completedJobs.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Jobs Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingJobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No pending jobs found</p>
                </CardContent>
              </Card>
            ) : (
              pendingJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{job.description}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {job.customers.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {job.vehicles.registration}
                          </span>
                          <span>Job ID: {job.id.substring(0, 8)}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCreateInvoice(job)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Completed Jobs Tab */}
          <TabsContent value="completed" className="space-y-4">
            {completedJobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No completed jobs found</p>
                </CardContent>
              </Card>
            ) : (
              completedJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{job.description}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {job.customers.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {job.vehicles.registration}
                          </span>
                          <span>Job ID: {job.id.substring(0, 8)}</span>
                          <span>Invoice: {job.invoices[0]?.invoice_number}</span>
                          {job.invoices[0]?.edit_request === 'requested' && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Edit Requested
                            </Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Ksh {job.cost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {job.invoices[0]?.edit_request === 'requested' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveEdit(job.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectEdit(job.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject Edit
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/invoices/${job.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Create Invoice Modal */}
        {selectedJob && (
          <CreateInvoiceModal
            isOpen={isInvoiceModalOpen}
            onClose={() => {
              setIsInvoiceModalOpen(false);
              setSelectedJob(null);
            }}
            jobId={selectedJob.id}
            jobDescription={selectedJob.description}
            customerName={selectedJob.customers.name}
            vehicleInfo={`${selectedJob.vehicles.registration} - ${selectedJob.vehicles.model}`}
            onInvoiceCreated={handleInvoiceCreated}
          />
        )}
      </div>
    </Layout>
  );
}