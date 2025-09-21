-- First, drop RLS policies that reference the columns we want to change
DROP POLICY IF EXISTS "Users can view their own edit requests" ON edit_requests;
DROP POLICY IF EXISTS "Employees can insert edit requests" ON edit_requests;
DROP POLICY IF EXISTS "Admins can update edit requests" ON edit_requests;
DROP POLICY IF EXISTS "Admins can view all edit requests" ON edit_requests;
DROP POLICY IF EXISTS "Authenticated users can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can update jobs" ON jobs;

-- Drop existing foreign key constraints (if they exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'edit_requests_employee_id_fkey') THEN
        ALTER TABLE edit_requests DROP CONSTRAINT edit_requests_employee_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'edit_requests_reviewed_by_fkey') THEN
        ALTER TABLE edit_requests DROP CONSTRAINT edit_requests_reviewed_by_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'jobs_assigned_employee_fkey') THEN
        ALTER TABLE jobs DROP CONSTRAINT jobs_assigned_employee_fkey;
    END IF;
END $$;

-- Change column data types
-- First, change the dependent columns to INTEGER (they should be empty, so this should work)
ALTER TABLE edit_requests ALTER COLUMN employee_id TYPE INTEGER USING employee_id::text::integer;
ALTER TABLE edit_requests ALTER COLUMN reviewed_by TYPE INTEGER USING reviewed_by::text::integer;
ALTER TABLE jobs ALTER COLUMN assigned_employee TYPE INTEGER USING assigned_employee::text::integer;

-- Now change the profiles.id column to SERIAL (auto increment integer)
-- First drop the existing primary key
ALTER TABLE profiles DROP CONSTRAINT profiles_pkey;
-- Change the column type and add auto increment
ALTER TABLE profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN id TYPE INTEGER USING id::text::integer;
-- Create a sequence for auto increment
CREATE SEQUENCE profiles_id_seq OWNED BY profiles.id;
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT nextval('profiles_id_seq');
-- Set the sequence to start from 1 (or current max + 1 if data exists)
SELECT setval('profiles_id_seq', COALESCE((SELECT MAX(id) FROM profiles), 0) + 1, false);
-- Re-add the primary key constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- Recreate foreign key constraints
ALTER TABLE edit_requests ADD CONSTRAINT edit_requests_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES profiles(id);
    
ALTER TABLE edit_requests ADD CONSTRAINT edit_requests_reviewed_by_fkey 
    FOREIGN KEY (reviewed_by) REFERENCES profiles(id);
    
ALTER TABLE jobs ADD CONSTRAINT jobs_assigned_employee_fkey 
    FOREIGN KEY (assigned_employee) REFERENCES profiles(id);

-- Recreate RLS policies
CREATE POLICY "Users can view their own edit requests" 
ON edit_requests 
FOR SELECT 
USING (employee_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Employees can insert edit requests" 
ON edit_requests 
FOR INSERT 
WITH CHECK (employee_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update edit requests" 
ON edit_requests 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'::user_role));

CREATE POLICY "Admins can view all edit requests" 
ON edit_requests 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'::user_role));

CREATE POLICY "Authenticated users can insert jobs" 
ON jobs 
FOR INSERT 
WITH CHECK (assigned_employee = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update jobs" 
ON jobs 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'::user_role));

-- Clear existing profile data and recreate admin profile with auto increment
DELETE FROM profiles WHERE user_id = '8d6da7b1-33ba-4449-8ea2-28da23e107ec';
INSERT INTO public.profiles (user_id, username, role, is_active)
VALUES (
  '8d6da7b1-33ba-4449-8ea2-28da23e107ec', 
  'admin', 
  'admin'::user_role, 
  true
);