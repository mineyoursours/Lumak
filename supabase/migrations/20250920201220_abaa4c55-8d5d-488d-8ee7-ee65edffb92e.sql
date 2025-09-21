-- Drop existing foreign key constraints (if they exist)
-- Note: These may not exist yet, so we'll use IF EXISTS
DO $$ 
BEGIN
    -- Drop foreign key constraints if they exist
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
-- First, change the dependent columns to INTEGER
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

-- Clear existing profile data and recreate admin profile with auto increment
DELETE FROM profiles WHERE user_id = '8d6da7b1-33ba-4449-8ea2-28da23e107ec';
INSERT INTO public.profiles (user_id, username, role, is_active)
VALUES (
  '8d6da7b1-33ba-4449-8ea2-28da23e107ec', 
  'admin', 
  'admin'::user_role, 
  true
);