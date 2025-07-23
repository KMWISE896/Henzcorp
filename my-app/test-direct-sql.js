// Direct SQL execution test
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

async function testDirectSQL() {
  console.log('🧪 Testing direct SQL execution...\n')
  
  try {
    // Test 1: Simple function creation
    console.log('1. Creating simple test function...')
    const { data: test1, error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION test_simple_function()
        RETURNS text AS $$
        BEGIN
          RETURN 'Hello from Supabase!';
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })
    
    if (error1) {
      console.log('❌ Simple function creation failed:', error1.message)
      console.log('🔍 This suggests RPC exec_sql is not available or restricted')
    } else {
      console.log('✅ Simple function created successfully')
      
      // Test calling the function
      const { data: testResult, error: testError } = await supabase.rpc('test_simple_function')
      if (testError) {
        console.log('❌ Function call failed:', testError.message)
      } else {
        console.log('✅ Function call works:', testResult)
      }
    }
    
    // Test 2: Check if we can see existing functions
    console.log('\n2. Checking existing functions...')
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .like('proname', '%referral%')
    
    if (funcError) {
      console.log('❌ Cannot query pg_proc:', funcError.message)
      console.log('🔍 This suggests limited database access')
    } else {
      console.log('✅ Found functions:', functions)
    }
    
    // Test 3: Try creating the critical auth function directly
    console.log('\n3. Creating auth signup function...')
    const authFunctionSQL = `
      CREATE OR REPLACE FUNCTION handle_new_user_signup()
      RETURNS trigger AS $$
      BEGIN
        -- Create user profile
        INSERT INTO user_profiles (
          id,
          first_name,
          last_name,
          phone,
          verification_status,
          referral_code
        ) VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
          COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
          COALESCE(NEW.raw_user_meta_data->>'phone', ''),
          'verified',
          'HENZ2025' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6))
        );

        -- Create default UGX wallet
        INSERT INTO wallets (
          user_id,
          currency,
          balance,
          available_balance,
          locked_balance
        ) VALUES (
          NEW.id,
          'UGX',
          0,
          0,
          0
        );

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
    
    const { data: authFunc, error: authError } = await supabase.rpc('exec_sql', {
      sql: authFunctionSQL
    })
    
    if (authError) {
      console.log('❌ Auth function creation failed:', authError.message)
    } else {
      console.log('✅ Auth function created')
      
      // Create the trigger
      console.log('\n4. Creating auth trigger...')
      const { data: trigger, error: triggerError } = await supabase.rpc('exec_sql', {
        sql: `
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();
        `
      })
      
      if (triggerError) {
        console.log('❌ Trigger creation failed:', triggerError.message)
      } else {
        console.log('✅ Auth trigger created successfully!')
        console.log('\n🎉 Try signing up now - it should work!')
      }
    }
    
  } catch (error) {
    console.error('❌ Direct SQL test failed:', error.message)
    console.log('\n📋 ALTERNATIVE SOLUTION:')
    console.log('Since direct SQL execution seems limited, you need to:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Manually paste and run the SQL from create_functions_and_triggers_clean.sql')
    console.log('3. This will create all the necessary functions and triggers')
  }
}

testDirectSQL()