-- Create enum types for better data integrity
CREATE TYPE invoice_status AS ENUM ('pending', 'completed');
CREATE TYPE invoice_edit_request AS ENUM ('none', 'requested', 'approved', 'rejected');

-- Add status and edit_request fields to invoices table with proper enum defaults
ALTER TABLE public.invoices 
ADD COLUMN status invoice_status NOT NULL DEFAULT 'completed'::invoice_status,
ADD COLUMN edit_request invoice_edit_request NOT NULL DEFAULT 'none'::invoice_edit_request;

-- Add RLS policy for admins to update invoice edit requests
CREATE POLICY "Admins can update invoice edit requests" 
ON public.invoices 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::user_role))));

-- Add RLS policy for employees to request edits on invoices
CREATE POLICY "Employees can request edits on invoices" 
ON public.invoices 
FOR UPDATE 
USING (edit_request = 'none' OR edit_request = 'approved');