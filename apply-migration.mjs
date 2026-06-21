/**
 * Applies supabase/migrations/002_visited_countries.sql
 * Usage: SUPABASE_ACCESS_TOKEN=<your-personal-token> node apply-migration.mjs
 *
 * Get your personal access token at: https://supabase.com/dashboard/account/tokens
 */
import { readFileSync } from 'node:fs'

const PROJECT_REF = 'fbfemyvwvvfispsdvskp'
const token = process.env.SUPABASE_ACCESS_TOKEN

if (!token) {
  console.error('❌  Set SUPABASE_ACCESS_TOKEN env var. Get yours at https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const file = process.argv[2] ?? './supabase/migrations/004_trip_destination.sql'
const sql = readFileSync(file, 'utf8')

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

const body = await res.json().catch(() => res.text())
if (res.ok) {
  console.log('✅  Migration applied successfully!')
} else {
  console.error('❌  Migration failed:', JSON.stringify(body, null, 2))
  process.exit(1)
}
