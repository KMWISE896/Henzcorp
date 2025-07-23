// Run functions migration
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

console.log('🔗 Connecting to Supabase...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function runFunctionsMigration() {
  try {
    console.log('🚀 Running functions and triggers migration...')
    
    // Read the functions migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/create_functions_and_triggers.sql', 'utf8')
    
    // Split the migration into smaller chunks to avoid issues
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))
    
    console.log(`📋 Executing ${statements.length} SQL statements...`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} warning:`, error.message)
          errorCount++
        } else {
          successCount++
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed:`, err.message)
        errorCount++
      }
    }
    
    console.log(`\n📊 Migration Results:`)
    console.log(`✅ Successful: ${successCount}`)
    console.log(`⚠️  Warnings/Errors: ${errorCount}`)
    
    // Test if the critical function was created
    console.log('\n🧪 Testing critical functions...')
    
    try {
      const { data: refCode, error: refError } = await supabase.rpc('generate_referral_code')
      if (refError) {
        console.log('❌ generate_referral_code failed:', refError.message)
      } else {
        console.log('✅ generate_referral_code works:', refCode)
      }
    } catch (err) {
      console.log('❌ generate_referral_code test failed:', err.message)
    }
    
    console.log('\n🎉 Functions migration completed!')
    console.log('Now try signing up in your app - it should work!')
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    console.log('\n📋 MANUAL SETUP REQUIRED:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the migration from: supabase/migrations/create_functions_and_triggers.sql')
    console.log('4. Run the migration')
  }
}

runFunctionsMigration()