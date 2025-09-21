-- Add status and edit_request fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN status TEXT NOT NULL DEFAULT 'completed',
ADD COLUMN edit_request TEXT NOT NULL DEFAULT 'none';

-- Create enum types for better data integrity
CREATE TYPE invoice_status AS ENUM ('pending', 'completed');
CREATE TYPE invoice_edit_request AS ENUM ('none', 'requested', 'approved', 'rejected');

-- Update the invoices table to use the new enum types
ALTER TABLE public.invoices 
ALTER COLUMN status TYPE invoice_status USING status::invoice_status,
ALTER COLUMN edit_request TYPE invoice_edit_request USING edit_request::invoice_edit_request;

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