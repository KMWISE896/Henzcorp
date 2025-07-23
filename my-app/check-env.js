// Quick environment variables checker
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔍 Checking environment variables...\n')

// Check if .env file exists
const envPath = join(__dirname, '.env')
console.log('📁 Looking for .env file at:', envPath)

if (existsSync(envPath)) {
  console.log('✅ .env file found!')
  
  // Read and display .env contents (without sensitive values)
  const envContent = readFileSync(envPath, 'utf8')
  console.log('\n📋 .env file contents:')
  
  envContent.split('\n').forEach((line, index) => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=')
      if (key && value) {
        console.log(`${index + 1}. ${key}=${value.length > 20 ? '[HIDDEN - ' + value.length + ' chars]' : value}`)
      }
    }
  })
  
  // Load environment variables
  config({ path: envPath })
  
  console.log('\n🔧 Environment variables after loading:')
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  
} else {
  console.log('❌ .env file not found!')
  console.log('\n📝 Please create a .env file with:')
  console.log('VITE_SUPABASE_URL=your_supabase_url')
  console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
}

console.log('\n🎯 Make sure your .env file contains:')
console.log('1. VITE_SUPABASE_URL (starts with https://)')
console.log('2. VITE_SUPABASE_ANON_KEY (long JWT token)')
console.log('3. No spaces around the = sign')
console.log('4. No quotes around the values')
console.log('\n💡 Example format:')
console.log('VITE_SUPABASE_URL=https://abcdefg.supabase.co')
console.log('VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')