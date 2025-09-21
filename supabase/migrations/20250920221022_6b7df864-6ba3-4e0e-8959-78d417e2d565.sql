-- Allow employees to update jobs they are assigned to
CREATE POLICY "Employees can update their assigned jobs" 
ON public.jobs 
FOR UPDATE 
USING (assigned_employee = (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));