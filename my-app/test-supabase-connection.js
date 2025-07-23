// Test Supabase connection and run migration
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.log('Please check your .env file contains:')
  console.log('VITE_SUPABASE_URL=your_supabase_url')
  console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  process.exit(1)
}

console.log('🔗 Connecting to Supabase...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    
    if (error) {
      console.log('⚠️  Tables not found, running migration...')
      await runMigration()
    } else {
      console.log('✅ Database connection successful!')
      console.log('✅ Tables already exist')
    }
    
    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.log('⚠️  Auth error:', authError.message)
    } else {
      console.log('✅ Auth system working')
    }
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message)
  }
}

async function runMigration() {
  try {
    console.log('🚀 Running database migration...')
    
    // Read the migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/setup_complete_database.sql', 'utf8')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error.message)
      
      // Try alternative approach - execute parts separately
      console.log('🔄 Trying alternative migration approach...')
      await runMigrationAlternative()
    } else {
      console.log('✅ Migration completed successfully!')
    }
    
  } catch (err) {
    console.error('❌ Migration error:', err.message)
    console.log('🔄 Trying alternative migration approach...')
    await runMigrationAlternative()
  }
}

async function runMigrationAlternative() {
  try {
    // Create tables one by one
    console.log('📋 Creating user_profiles table...')
    
    const { error: profileError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          first_name text NOT NULL,
          last_name text NOT NULL,
          phone text NOT NULL,
          profile_image_url text,
          verification_status text DEFAULT 'pending',
          referral_code text UNIQUE NOT NULL,
          referred_by uuid,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can manage own profile" ON user_profiles
          FOR ALL TO authenticated
          USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
      `
    })
    
    if (profileError) {
      console.log('⚠️  Could not create tables via RPC')
      console.log('Please run the migration manually in your Supabase dashboard')
      console.log('Go to: https://supabase.com/dashboard/project/[your-project]/sql')
      console.log('Copy and paste the contents of: supabase/migrations/setup_complete_database.sql')
    } else {
      console.log('✅ Basic tables created!')
    }
    
  } catch (err) {
    console.error('❌ Alternative migration failed:', err.message)
    console.log('\n📋 MANUAL SETUP REQUIRED:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the migration from: supabase/migrations/setup_complete_database.sql')
    console.log('4. Run the migration')
  }
}

// Run the test
testConnection()