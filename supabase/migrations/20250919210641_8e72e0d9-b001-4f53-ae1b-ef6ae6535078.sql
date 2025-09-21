-- Create admin profile for existing user
INSERT INTO public.profiles (user_id, username, role, is_active)
VALUES (
  '8d6da7b1-33ba-4449-8ea2-28da23e107ec', 
  'admin', 
  'admin'::user_role, 
  true
);