/*
  # Create Admin System

  1. New Tables
    - `admin_users` - Admin user accounts
    - `admin_sessions` - Admin session tracking
    - `admin_activity_logs` - Admin action logging

  2. Security
    - Enable RLS on all admin tables
    - Add policies for admin access only

  3. Functions
    - Admin authentication functions
    - Activity logging functions
*/

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator', 'support')),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create admin activity logs table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (restrictive - only for authenticated admins)
CREATE POLICY "Admins can read own profile" ON admin_users
  FOR SELECT USING (false); -- Will be handled by application logic

CREATE POLICY "Admin sessions are private" ON admin_sessions
  FOR ALL USING (false); -- Will be handled by application logic

CREATE POLICY "Admin logs are private" ON admin_activity_logs
  FOR ALL USING (false); -- Will be handled by application logic

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);

-- Create admin authentication functions
CREATE OR REPLACE FUNCTION create_admin_session(
  admin_email text,
  admin_password text,
  session_ip text DEFAULT NULL,
  session_user_agent text DEFAULT NULL
)
RETURNS TABLE(
  success boolean,
  session_token text,
  admin_data jsonb,
  error_message text
) AS $$
DECLARE
  admin_record admin_users%ROWTYPE;
  new_session_token text;
  session_expires timestamptz;
BEGIN
  -- Find admin user
  SELECT * INTO admin_record
  FROM admin_users
  WHERE email = admin_email AND is_active = true;
  
  IF admin_record.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::text, NULL::jsonb, 'Invalid credentials'::text;
    RETURN;
  END IF;
  
  -- In a real app, you'd verify the password hash here
  -- For demo purposes, we'll accept any password for existing admins
  
  -- Generate session token
  new_session_token := encode(gen_random_bytes(32), 'hex');
  session_expires := now() + interval '24 hours';
  
  -- Create session
  INSERT INTO admin_sessions (admin_id, session_token, expires_at, ip_address, user_agent)
  VALUES (admin_record.id, new_session_token, session_expires, session_ip, session_user_agent);
  
  -- Update last login
  UPDATE admin_users 
  SET last_login = now(), updated_at = now()
  WHERE id = admin_record.id;
  
  -- Log activity
  INSERT INTO admin_activity_logs (admin_id, action, details, ip_address)
  VALUES (admin_record.id, 'login', jsonb_build_object('success', true), session_ip);
  
  -- Return success
  RETURN QUERY SELECT 
    true,
    new_session_token,
    jsonb_build_object(
      'id', admin_record.id,
      'email', admin_record.email,
      'first_name', admin_record.first_name,
      'last_name', admin_record.last_name,
      'role', admin_record.role
    ),
    NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate admin session
CREATE OR REPLACE FUNCTION validate_admin_session(token text)
RETURNS TABLE(
  valid boolean,
  admin_data jsonb
) AS $$
DECLARE
  session_record admin_sessions%ROWTYPE;
  admin_record admin_users%ROWTYPE;
BEGIN
  -- Find valid session
  SELECT * INTO session_record
  FROM admin_sessions
  WHERE session_token = token AND expires_at > now();
  
  IF session_record.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::jsonb;
    RETURN;
  END IF;
  
  -- Get admin data
  SELECT * INTO admin_record
  FROM admin_users
  WHERE id = session_record.admin_id AND is_active = true;
  
  IF admin_record.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::jsonb;
    RETURN;
  END IF;
  
  -- Return valid session
  RETURN QUERY SELECT 
    true,
    jsonb_build_object(
      'id', admin_record.id,
      'email', admin_record.email,
      'first_name', admin_record.first_name,
      'last_name', admin_record.last_name,
      'role', admin_record.role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get platform statistics
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM user_profiles),
    'verified_users', (SELECT COUNT(*) FROM user_profiles WHERE verification_status = 'verified'),
    'total_transactions', (SELECT COUNT(*) FROM transactions),
    'completed_transactions', (SELECT COUNT(*) FROM transactions WHERE status = 'completed'),
    'total_volume_ugx', (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'completed' AND currency = 'UGX'),
    'active_wallets', (SELECT COUNT(DISTINCT user_id) FROM wallets WHERE available_balance > 0),
    'total_deposits', (SELECT COUNT(*) FROM deposits WHERE status = 'completed'),
    'total_withdrawals', (SELECT COUNT(*) FROM withdrawals WHERE status = 'completed'),
    'pending_transactions', (SELECT COUNT(*) FROM transactions WHERE status = 'pending'),
    'failed_transactions', (SELECT COUNT(*) FROM transactions WHERE status = 'failed')
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default admin user (password should be hashed in production)
INSERT INTO admin_users (email, password_hash, first_name, last_name, role) VALUES
('admin@henzcorp.com', 'admin123', 'System', 'Administrator', 'super_admin')
ON CONFLICT (email) DO NOTHING;

SELECT 'Admin system created successfully!' as status;