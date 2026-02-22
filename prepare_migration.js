
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Actually, we need service_role key to run migrations usually, but RLS might block if anon. 
// However, the user provided ANON key in .env.local. 
// Standard `supabase db reset` uses local CLI which has full access.
// Since I cannot use `supabase db reset` reliably due to piping, I will use the `postgres` library if available, or try to read the file in Node and pass it to a shell command as an argument (risky with size).

// BETTER APPROACH: Use `fs` to read the file, and then write a temporary utf-8 clean file, then run `supabase db reset` on THAT file.
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '16_reviews_system.sql');
const cleanPath = path.join(__dirname, 'supabase', 'migrations', '16_reviews_system_clean.sql');

try {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    // Write it back to ensure encoding is correct (Node defaults to utf8)
    fs.writeFileSync(cleanPath, sql, 'utf8');
    console.log("Clean SQL file created at:", cleanPath);
} catch (e) {
    console.error("Error reading/writing file:", e);
}
