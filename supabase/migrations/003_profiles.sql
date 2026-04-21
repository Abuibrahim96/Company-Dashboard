-- ============================================================
-- Elite Truck Lines – Profiles & Team Roles
-- Migration: 003_profiles.sql
--
-- Adds a profiles table linked to auth.users to track team
-- membership and role (admin | member). DASHBOARD_ADMIN_EMAILS
-- remains a runtime bootstrap fallback in app code.
-- ============================================================

CREATE TABLE profiles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('admin', 'member')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper used by RLS policies. SECURITY DEFINER so the function
-- itself can read profiles regardless of the caller's policies,
-- avoiding recursion when policies reference profiles.
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = uid AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Backfill profiles for existing authenticated users (default role member).
INSERT INTO profiles (user_id, email)
SELECT u.id, COALESCE(u.email, '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- A user can always read their own profile (so the app can resolve role).
CREATE POLICY "self_select_profile" ON profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all profiles.
CREATE POLICY "admin_select_profiles" ON profiles
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admins can insert / update / delete profiles.
CREATE POLICY "admin_modify_profiles" ON profiles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
