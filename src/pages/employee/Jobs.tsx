import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, CheckCircle, Eye, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateInvoiceModal } from '@/components/CreateInvoiceModal';
interface Job {
  id: string;
  description: string;
  cost: number;
  status: 'pending' | 'completed';
  notes: string | null;
  created_at: string;
  customer: {
    id: string;
    name: string;
  };
  vehicle: {
    id: string;
    registration: string;
    model: string;
    type: string;
  };
  profile: {
    id: number;
    username: string;
  };
  invoices: {
    id: string;
    invoice_number: string;
  } | null;
}
export default function EmployeeJobs() {
  const {
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedJobForInvoice, setSelectedJobForInvoice] = useState<Job | null>(null);
  useEffect(() => {
    fetchJobs();
  }, []);
  const fetchJobs = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('jobs').select(`
          *,
          customer:customers(id, name),
          vehicle:vehicles(id, registration, model, type),
          profile:profiles!jobs_assigned_employee_fkey(id, username),
          invoices(id, invoice_number)
        `).eq('assigned_employee', profile?.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      console.log('Fetched jobs data:', data);
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const markJobAsCompleted = async (jobId: string) => {
    try {
      const {
        error
      } = await supabase.from('jobs').update({
        status: 'completed'
      }).eq('id', jobId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Job marked as completed"
      });
      await fetchJobs();
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive"
      });
    }
  };
  const handleCreateInvoice = (job: Job) => {
    setSelectedJobForInvoice(job);
    setIsInvoiceModalOpen(true);
  };

  const handleInvoiceCreated = () => {
    fetchJobs();
  };
  const filteredJobs = jobs.filter(job => 
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    job.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    job.vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase()) || 
    job.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pendingJobs = filteredJobs.filter(job => job.status === 'pending');
  const completedJobs = filteredJobs.filter(job => job.status === 'completed' && job.invoices);
  if (loading) {
    return <Layout title="My Jobs">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>;
  }
  return <Layout title="My Jobs">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/employee')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">My Jobs</h1>
          </div>
          <Button onClick={() => navigate('/employee/create-job')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Job
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search jobs by description, customer, vehicle..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
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

          <TabsContent value="pending" className="space-y-4">
            {pendingJobs.length === 0 ? <div className="text-center py-8">
                <p className="text-muted-foreground">No pending jobs found</p>
              </div> : pendingJobs.map(job => <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.description}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{job.status}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Created: {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                         <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleCreateInvoice(job)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Invoice
                          </Button>
                       </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Customer</h4>
                        <p>{job.customer.name}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Vehicle</h4>
                        <p>{job.vehicle.registration} - {job.vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{job.vehicle.type}</p>
                      </div>
                       <div>
                         <h4 className="font-semibold text-sm text-muted-foreground">Cost</h4>
                         <p className="text-lg font-semibold">Ksh {job.cost.toFixed(2)}</p>
                       </div>
                    </div>
                    {job.notes && <div className="mt-4">
                        <h4 className="font-semibold text-sm text-muted-foreground">Notes</h4>
                        <p className="text-sm">{job.notes}</p>
                      </div>}
                  </CardContent>
                </Card>)}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedJobs.length === 0 ? <div className="text-center py-8">
                <p className="text-muted-foreground">No completed jobs found</p>
              </div> : completedJobs.map(job => <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                       <div className="flex items-center justify-between w-full">
                         <CardTitle className="text-lg">{job.description}</CardTitle>
                         <div className="flex items-center gap-2">
                           <Badge variant="default" className="mx-[50px]">{job.status}</Badge>
                           <span className="text-sm text-muted-foreground mx-[50px]">
                             Created: {new Date(job.created_at).toLocaleDateString()}
                           </span>
                         </div>
                       </div>
                         <div className="flex gap-2">
                           <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${job.id}`)}>
                             <Eye className="h-4 w-4 mr-1" />
                             View Invoice
                           </Button>
                         </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Customer</h4>
                        <p>{job.customer.name}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Vehicle</h4>
                        <p>{job.vehicle.registration} - {job.vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{job.vehicle.type}</p>
                      </div>
                       <div>
                         <h4 className="font-semibold text-sm text-muted-foreground">Cost</h4>
                         <p className="text-lg font-semibold">Ksh {job.cost.toFixed(2)}</p>
                       </div>
                    </div>
                    {job.notes && <div className="mt-4">
                        <h4 className="font-semibold text-sm text-muted-foreground">Notes</h4>
                        <p className="text-sm">{job.notes}</p>
                      </div>}
                  </CardContent>
                </Card>)}
          </TabsContent>
        </Tabs>

        {/* Create Invoice Modal */}
        {selectedJobForInvoice && (
          <CreateInvoiceModal
            isOpen={isInvoiceModalOpen}
            onClose={() => {
              setIsInvoiceModalOpen(false);
              setSelectedJobForInvoice(null);
            }}
            jobId={selectedJobForInvoice.id}
            jobDescription={selectedJobForInvoice.description}
            customerName={selectedJobForInvoice.customer.name}
            vehicleInfo={`${selectedJobForInvoice.vehicle.registration} - ${selectedJobForInvoice.vehicle.model}`}
            onInvoiceCreated={handleInvoiceCreated}
          />
        )}
      </div>
    </Layout>;
}