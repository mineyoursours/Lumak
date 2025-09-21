-- Fix admin user creation - remove generated email column from identities
-- Insert admin user into auth.users with proper fields
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '8d6da7b1-33ba-4449-8ea2-28da23e107ec',
  'authenticated',
  'authenticated',
  'admin@company.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"sub": "8d6da7b1-33ba-4449-8ea2-28da23e107ec", "email": "admin@company.com"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Insert corresponding auth.identities record (without generated email column)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '8d6da7b1-33ba-4449-8ea2-28da23e107ec',
  jsonb_build_object(
    'sub', '8d6da7b1-33ba-4449-8ea2-28da23e107ec',
    'email', 'admin@company.com',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  '8d6da7b1-33ba-4449-8ea2-28da23e107ec',
  now(),
  now()
);