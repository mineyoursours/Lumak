-- Create admin user in auth.users table and link to existing profile
-- First, let's insert the admin user directly into auth.users
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '8d6da7b1-33ba-4449-8ea2-28da23e107ec',
  'authenticated',
  'authenticated',
  'admin@company.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create corresponding auth.identities record with provider_id
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at,
  email
) VALUES (
  gen_random_uuid(),
  '8d6da7b1-33ba-4449-8ea2-28da23e107ec',
  jsonb_build_object('sub', '8d6da7b1-33ba-4449-8ea2-28da23e107ec', 'email', 'admin@company.com'),
  'email',
  '8d6da7b1-33ba-4449-8ea2-28da23e107ec',
  now(),
  now(),
  'admin@company.com'
);