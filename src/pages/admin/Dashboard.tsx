import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, Car, Wrench, CheckCircle, Clock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalCustomers: number;
  totalVehicles: number;
  pendingJobs: number;
  completedJobs: number;
  totalEmployees: number;
}

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
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalVehicles: 0,
    pendingJobs: 0,
    completedJobs: 0,
    totalEmployees: 0,
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
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
          profiles!jobs_assigned_employee_fkey (username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [
        { count: totalCustomers },
        { count: totalVehicles },
        { count: pendingJobs },
        { count: completedJobs },
        { count: totalEmployees }
      ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      setStats({
        totalCustomers: totalCustomers || 0,
        totalVehicles: totalVehicles || 0,
        pendingJobs: pendingJobs || 0,
        completedJobs: completedJobs || 0,
        totalEmployees: totalEmployees || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: Car,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Pending Jobs',
      value: stats.pendingJobs,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Completed Jobs',
      value: stats.completedJobs,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Active Employees',
      value: stats.totalEmployees,
      icon: Wrench,
      color: 'text-secondary-foreground',
      bgColor: 'bg-secondary',
    },
  ];

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
        </div>

        {/* Jobs Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Jobs Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">
                  Pending Jobs ({jobs.filter(job => job.status === 'pending').length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed Jobs ({jobs.filter(job => job.status === 'completed').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-2 mt-4">
                {jobs.filter(job => job.status === 'pending').slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">{job.description}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{job.customers.name}</span>
                        <span>{job.vehicles.registration}</span>
                        <span>Ksh {job.cost.toFixed(2)}</span>
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">pending</Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/invoices/${job.id}`)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {jobs.filter(job => job.status === 'pending').length > 5 && (
                  <Button variant="outline" className="w-full mt-2" onClick={() => navigate('/admin/jobs')}>
                    View All Pending Jobs
                  </Button>
                )}
                {jobs.filter(job => job.status === 'pending').length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No pending jobs</p>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-2 mt-4">
                {jobs.filter(job => job.status === 'completed').slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">{job.description}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{job.customers.name}</span>
                        <span>{job.vehicles.registration}</span>
                        <span>Ksh {job.cost.toFixed(2)}</span>
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">completed</Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/invoices/${job.id}`)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {jobs.filter(job => job.status === 'completed').length > 5 && (
                  <Button variant="outline" className="w-full mt-2" onClick={() => navigate('/admin/jobs')}>
                    View All Completed Jobs
                  </Button>
                )}
                {jobs.filter(job => job.status === 'completed').length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No completed jobs</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}