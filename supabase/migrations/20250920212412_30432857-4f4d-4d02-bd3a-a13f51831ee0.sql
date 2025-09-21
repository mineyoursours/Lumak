-- Fix admin user creation by using proper auth functions
-- First, let's create the admin user using the admin auth functions

-- Create admin user properly
SELECT auth.create_user(
  'admin@company.com',
  'admin123',
  '{"role": "admin"}'::jsonb,
  'admin@company.com',
  '8d6da7b1-33ba-4449-8ea2-28da23e107ec'::uuid,
  true  -- email_confirmed
);