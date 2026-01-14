import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env from the web app directory
dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function purgeUsers() {
    console.log('Fetching all users...')
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
        console.error('Error fetching users:', error.message)
        return
    }

    console.log(`Found ${users.length} users. Commencing purge...`)

    for (const user of users) {
        console.log(`Deleting user: ${user.email} (${user.id})`)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        if (deleteError) {
            console.error(`Failed to delete ${user.email}:`, deleteError.message)
        }
    }

    console.log('Purge complete. System is now fresh.')
}

purgeUsers()
