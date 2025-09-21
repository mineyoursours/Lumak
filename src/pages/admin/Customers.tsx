import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Phone, Mail, Calendar, ArrowLeft, ChevronDown, Car, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  created_by: string;
}

interface Vehicle {
  id: string;
  registration: string;
  model: string;
  type: string;
  customer_id: string;
}

interface Job {
  id: string;
  status: 'pending' | 'completed';
  description: string;
  created_at: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [customerVehicles, setCustomerVehicles] = useState<Record<string, Vehicle[]>>({});
  const [customerJobs, setCustomerJobs] = useState<Record<string, Job | null>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId);

      if (vehiclesError) throw vehiclesError;

      // Fetch latest job
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, status, description, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (jobsError) throw jobsError;

      setCustomerVehicles(prev => ({
        ...prev,
        [customerId]: vehiclesData || []
      }));

      setCustomerJobs(prev => ({
        ...prev,
        [customerId]: jobsData?.[0] || null
      }));
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast({
        title: "Error",
        description: "Failed to load customer details",
        variant: "destructive",
      });
    }
  };

  const toggleCustomerExpanded = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
      // Fetch details if not already loaded
      if (!customerVehicles[customerId]) {
        fetchCustomerDetails(customerId);
      }
    }
    setExpandedCustomers(newExpanded);
  };

  if (loading) {
    return (
      <Layout title="Customers">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Customers">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">Manage all customers</p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-4">
          {customers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full"
                  onClick={() => toggleCustomerExpanded(customer.id)}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-left">{customer.name}</h3>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {customer.email || 'No email'}
                          </span>
                          <span className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {customer.phone || 'No phone'}
                          </span>
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(customer.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          See More
                        </Button>
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform ${
                            expandedCustomers.has(customer.id) ? 'transform rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {expandedCustomers.has(customer.id) && (
                    <div className="px-4 pb-4 border-t">
                      <div className="grid md:grid-cols-2 gap-6 pt-4">
                        {/* Vehicles */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Vehicles ({customerVehicles[customer.id]?.length || 0})
                          </h4>
                          {customerVehicles[customer.id]?.length > 0 ? (
                            <div className="space-y-2">
                              {customerVehicles[customer.id].map((vehicle) => (
                                <div key={vehicle.id} className="p-3 border rounded-lg">
                                  <p className="font-medium">{vehicle.registration}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {vehicle.model} • {vehicle.type}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No vehicles registered</p>
                          )}
                        </div>

                        {/* Latest Job Status */}
                        <div>
                          <h4 className="font-semibold mb-3">Latest Job Status</h4>
                          {customerJobs[customer.id] ? (
                            <div className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Badge 
                                  variant={customerJobs[customer.id].status === 'completed' ? 'default' : 'secondary'}
                                  className="flex items-center gap-1"
                                >
                                  {customerJobs[customer.id].status === 'completed' ? (
                                    <CheckCircle className="h-3 w-3" />
                                  ) : (
                                    <Clock className="h-3 w-3" />
                                  )}
                                  {customerJobs[customer.id].status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(customerJobs[customer.id].created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm">{customerJobs[customer.id].description}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No jobs found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}

          {customers.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No customers found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}