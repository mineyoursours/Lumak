-- Update RLS policies for jobs table so employees only see jobs they created
-- First drop the existing policy that allows employees to see all jobs
DROP POLICY IF EXISTS "All authenticated users can view jobs" ON public.jobs;

-- Create new policy so employees only see jobs they created (where they are the assigned employee)
CREATE POLICY "Employees can view their own jobs" 
ON public.jobs 
FOR SELECT 
USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = assigned_employee)
  OR 
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Also update the insert policy to be clearer
DROP POLICY IF EXISTS "Authenticated users can insert jobs" ON public.jobs;

CREATE POLICY "Users can create jobs assigned to themselves" 
ON public.jobs 
FOR INSERT 
WITH CHECK (
  assigned_employee = (SELECT id FROM profiles WHERE user_id = auth.uid())
);