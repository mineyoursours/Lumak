import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save } from 'lucide-react';

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  onInvoiceSaved: () => void;
}

interface JobData {
  id: string;
  description: string;
  cost: number;
  notes: string | null;
  customer_id: string;
  vehicle_id: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  vehicle: {
    id: string;
    registration: string;
    model: string;
    type: string;
  };
}

export function EditInvoiceModal({ isOpen, onClose, jobId, onInvoiceSaved }: EditInvoiceModalProps) {
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    cost: '',
    notes: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleRegistration: '',
    vehicleModel: '',
    vehicleType: ''
  });
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    if (isOpen && jobId) {
      fetchJobData();
    }
  }, [isOpen, jobId]);

  const fetchJobData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          description,
          cost,
          notes,
          customer_id,
          vehicle_id,
          customer:customers (
            id,
            name,
            phone,
            email
          ),
          vehicle:vehicles (
            id,
            registration,
            model,
            type
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;

      setJobData(data);
      setFormData({
        description: data.description,
        cost: data.cost.toString(),
        notes: data.notes || '',
        customerName: data.customer.name,
        customerPhone: data.customer.phone || '',
        customerEmail: data.customer.email || '',
        vehicleRegistration: data.vehicle.registration,
        vehicleModel: data.vehicle.model,
        vehicleType: data.vehicle.type
      });
    } catch (error) {
      console.error('Error fetching job data:', error);
      toast({
        title: "Error",
        description: "Failed to load job data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update job details
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          description: formData.description,
          cost: parseFloat(formData.cost),
          notes: formData.notes || null
        })
        .eq('id', jobId);

      if (jobError) throw jobError;

      // Update customer details
      if (jobData) {
        const { error: customerError } = await supabase
          .from('customers')
          .update({
            name: formData.customerName,
            phone: formData.customerPhone || null,
            email: formData.customerEmail || null
          })
          .eq('id', jobData.customer_id);

        if (customerError) throw customerError;

        // Update vehicle details
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({
            registration: formData.vehicleRegistration,
            model: formData.vehicleModel,
            type: formData.vehicleType
          })
          .eq('id', jobData.vehicle_id);

        if (vehicleError) throw vehicleError;
      }

      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });

      onInvoiceSaved();
      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice Details</DialogTitle>
          <DialogDescription>
            Update the job and invoice information
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Job Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Job Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter job description"
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Cost (Ksh)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerName">Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="Email address"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Vehicle Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vehicleRegistration">Registration</Label>
                  <Input
                    id="vehicleRegistration"
                    value={formData.vehicleRegistration}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleRegistration: e.target.value }))}
                    placeholder="Vehicle registration"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleModel">Model</Label>
                  <Input
                    id="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                    placeholder="Vehicle model"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleType">Type</Label>
                  <Input
                    id="vehicleType"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                    placeholder="Vehicle type"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}