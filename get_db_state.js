const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
        }
        envVars[key] = val;
    }
});

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log("Fetching profiles using Service Key (bypass RLS)...");
    const { data: profiles, error } = await supabase.from('profiles').select('id, role, full_name, created_at').order('created_at', { ascending: false });
    if (error) console.error("Error profiles:", error);
    else console.table(profiles);

    console.log("\nFetching users from auth.users...");
    const { data: authUsers, error: errAuth } = await supabase.auth.admin.listUsers();
    if (errAuth) console.error("Error auth:", errAuth);
    else {
        const list = authUsers.users.map(u => ({ id: u.id, email: u.email }));
        console.table(list);
    }
}

run();
