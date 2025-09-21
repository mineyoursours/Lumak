import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, X, ArrowLeft } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Vehicle {
  id: string;
  registration: string;
  model: string;
  type: string;
  customer_id: string;
}

export default function EmployeeJobForm() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>(''); 
  const [jobDescription, setJobDescription] = useState('');
  
  const [jobStatus, setJobStatus] = useState<'pending' | 'completed'>('pending');
  const [jobNotes, setJobNotes] = useState('');

  // New customer form
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // New vehicle form
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehicleRegistration, setNewVehicleRegistration] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchCustomers();
    
    // Warn user about unsaved changes when leaving
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    // Track unsaved changes
    const hasData = selectedCustomer || jobDescription || jobNotes ||
                   newCustomerName || newCustomerPhone || newCustomerEmail ||
                   newVehicleRegistration || newVehicleModel || newVehicleType;
    setHasUnsavedChanges(!!hasData);
  }, [selectedCustomer, jobDescription, jobNotes, newCustomerName, 
      newCustomerPhone, newCustomerEmail, newVehicleRegistration, newVehicleModel, newVehicleType]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchVehiclesForCustomer(selectedCustomer);
    } else {
      setVehicles([]);
      setSelectedVehicle('');
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching customers:', error);
    } else {
      setCustomers(data || []);
    }
  };

  const fetchVehiclesForCustomer = async (customerId: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId)
      .order('registration');
    
    if (error) {
      console.error('Error fetching vehicles:', error);
    } else {
      setVehicles(data || []);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        email: newCustomerEmail.trim(),
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      });
    } else {
      setCustomers(prev => [...prev, data]);
      setSelectedCustomer(data.id);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setShowNewCustomer(false);
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
    }
    setIsLoading(false);
  };

  const handleAddVehicle = async () => {
    if (!selectedCustomer || !newVehicleRegistration.trim() || !newVehicleModel.trim() || !newVehicleType.trim()) {
      toast({
        title: "Error",
        description: "All vehicle fields are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        customer_id: selectedCustomer,
        registration: newVehicleRegistration.trim(),
        model: newVehicleModel.trim(),
        type: newVehicleType.trim(),
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add vehicle",
        variant: "destructive",
      });
    } else {
      setVehicles(prev => [...prev, data]);
      setSelectedVehicle(data.id);
      setNewVehicleRegistration('');
      setNewVehicleModel('');
      setNewVehicleType('');
      setShowNewVehicle(false);
      toast({
        title: "Success",
        description: "Vehicle added successfully",
      });
    }
    setIsLoading(false);
  };

  const handleSaveJob = async () => {
    if (!selectedCustomer || !selectedVehicle || !jobDescription.trim()) {
      toast({
        title: "Error",
        description: "Customer, Vehicle, and Job Description are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Create job (without cost)
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .insert({
        customer_id: selectedCustomer,
        vehicle_id: selectedVehicle,
        description: jobDescription.trim(),
        cost: 0, // Jobs are saved without cost initially
        status: jobStatus,
        notes: jobNotes.trim(),
        assigned_employee: profile?.id,
      })
      .select()
      .single();

    if (jobError) {
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Success",
      description: "Job saved successfully - now available in Pending Jobs",
    });

    // Clear form
    setSelectedCustomer('');
    setSelectedVehicle('');
    setJobDescription('');
    setJobStatus('pending');
    setJobNotes('');
    setHasUnsavedChanges(false);
    setIsLoading(false);

    // Navigate back to jobs
    navigate('/employee');
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
    navigate('/employee');
    }
  };

  const handleConfirmCancel = () => {
    // Clear all form data
    setSelectedCustomer('');
    setSelectedVehicle('');
    setJobDescription('');
    setJobStatus('pending');
    setJobNotes('');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerEmail('');
    setNewVehicleRegistration('');
    setNewVehicleModel('');
    setNewVehicleType('');
    setHasUnsavedChanges(false);
    setShowExitDialog(false);
    navigate('/employee');
  };

  return (
    <Layout title="Create New Job">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Create New Job</h1>
          </div>
        </div>
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showNewCustomer ? (
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="customer">Select Customer</Label>
                  <Combobox
                    value={selectedCustomer}
                    onSelect={setSelectedCustomer}
                    placeholder="Choose a customer"
                    searchPlaceholder="Search customers..."
                    options={customers.map(customer => ({
                      value: customer.id,
                      label: `${customer.name} - ${customer.phone || 'No phone'}`
                    }))}
                    emptyMessage="No customers found"
                    className="w-full"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCustomer(true)}
                >
                  <Plus className="h-4 w-4" />
                  New Customer
                </Button>
              </div>
            ) : (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Add New Customer</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewCustomer(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customerName">Name *</Label>
                    <Input
                      id="customerName"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                      placeholder="Email address"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddCustomer}
                  disabled={isLoading}
                  className="w-full"
                >
                  Add Customer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Selection */}
        {selectedCustomer && (
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showNewVehicle ? (
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="vehicle">Select Vehicle</Label>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.registration} - {vehicle.model} ({vehicle.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewVehicle(true)}
                  >
                    <Plus className="h-4 w-4" />
                    New Vehicle
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Add New Vehicle</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewVehicle(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="vehicleRegistration">Registration *</Label>
                      <Input
                        id="vehicleRegistration"
                        value={newVehicleRegistration}
                        onChange={(e) => setNewVehicleRegistration(e.target.value)}
                        placeholder="License plate"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel">Model *</Label>
                      <Input
                        id="vehicleModel"
                        value={newVehicleModel}
                        onChange={(e) => setNewVehicleModel(e.target.value)}
                        placeholder="Make and model"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleType">Type *</Label>
                      <Input
                        id="vehicleType"
                        value={newVehicleType}
                        onChange={(e) => setNewVehicleType(e.target.value)}
                        placeholder="Car, truck, motorcycle, etc."
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddVehicle}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Add Vehicle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Job Details */}
        {selectedCustomer && selectedVehicle && (
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Description of work to be performed"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="jobStatus">Status</Label>
                <Select value={jobStatus} onValueChange={(value: 'pending' | 'completed') => setJobStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="jobNotes">Notes</Label>
                <Textarea
                  id="jobNotes"
                  value={jobNotes}
                  onChange={(e) => setJobNotes(e.target.value)}
                  placeholder="Additional notes about the job"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveJob}
            disabled={isLoading || !selectedCustomer || !selectedVehicle || !jobDescription.trim()}
          >
            <Save className="h-4 w-4" />
            Save Job
          </Button>
        </div>
      </div>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. All entered data will be lost if you cancel. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel & Lose Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}