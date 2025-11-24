const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigrations() {
  console.log('Reading migrations.sql...')
  const sql = fs.readFileSync(path.join(__dirname, 'migrations.sql'), 'utf8')

  // Split by semicolon and run each statement
  const statements = sql.split(';').filter(s => s.trim().length > 0)

  console.log(`Running ${statements.length} SQL statements...`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim()
    if (statement) {
      console.log(`\n[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`)

      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        console.error(`Error: ${error.message}`)
        // Continue with other statements
      } else {
        console.log('✓ Success')
      }
    }
  }

  console.log('\nMigrations complete!')
}

runMigrations().catch(console.error)
