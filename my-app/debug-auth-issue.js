// Debug auth trigger issue
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAuthIssue() {
  console.log('🔍 Debugging auth trigger issue...\n')
  
  try {
    // Check if user_profiles table exists and has the right structure
    console.log('1. Checking user_profiles table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.log('❌ user_profiles table issue:', tableError.message)
      console.log('🔧 Need to create user_profiles table')
      return
    } else {
      console.log('✅ user_profiles table exists')
    }
    
    // Check if the auth trigger function exists
    console.log('\n2. Checking auth trigger function...')
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT proname, prosrc 
          FROM pg_proc 
          WHERE proname = 'handle_new_user_signup';
        `
      })
    
    if (funcError) {
      console.log('⚠️  Cannot check functions directly, will try alternative approach')
    }
    
    // Check if referral_code generation function exists
    console.log('\n3. Testing referral code generation...')
    const { data: refCode, error: refError } = await supabase
      .rpc('generate_referral_code')
    
    if (refError) {
      console.log('❌ generate_referral_code function missing:', refError.message)
      console.log('🔧 Need to create referral code function')
    } else {
      console.log('✅ generate_referral_code function works:', refCode)
    }
    
    // Try to manually create a user profile to test the process
    console.log('\n4. Testing manual user profile creation...')
    const testUserId = '00000000-0000-0000-0000-000000000001'
    
    // First delete any existing test user
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', testUserId)
    
    // Try to create a test profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        first_name: 'Test',
        last_name: 'User',
        phone: '+256700000000',
        referral_code: 'TESTCODE123'
      })
      .select()
    
    if (profileError) {
      console.log('❌ Manual profile creation failed:', profileError.message)
      
      // Check if it's a referral_code constraint issue
      if (profileError.message.includes('referral_code')) {
        console.log('🔧 Issue with referral_code constraint or trigger')
      }
    } else {
      console.log('✅ Manual profile creation works')
      
      // Clean up test user
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId)
    }
    
    // Check auth.users table permissions
    console.log('\n5. Checking auth system...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('❌ Auth system error:', authError.message)
    } else {
      console.log('✅ Auth system accessible')
    }
    
    console.log('\n📋 DIAGNOSIS:')
    console.log('The issue is likely one of these:')
    console.log('1. Auth trigger function is missing or broken')
    console.log('2. generate_referral_code function is missing')
    console.log('3. RLS policies are blocking the trigger')
    console.log('4. Foreign key constraints are failing')
    
    console.log('\n🔧 SOLUTION:')
    console.log('Run the complete migration manually in Supabase Dashboard:')
    console.log('1. Go to https://supabase.com/dashboard/project/xdouqtbiohhfpwjqkqbv/sql')
    console.log('2. Copy contents of: my-app/supabase/migrations/setup_complete_database.sql')
    console.log('3. Paste and run the entire migration')
    console.log('4. This will recreate all functions and triggers properly')
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

debugAuthIssue()