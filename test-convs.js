require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
    const { data, error } = await supabase.from('conversations').select('*, properties(id, title, image_urls, images), guest:profiles!conversations_guest_id_fkey(full_name), owner:profiles!conversations_owner_id_fkey(full_name)').limit(5);
    console.log(JSON.stringify(data, null, 2));
    if (error) console.error(error);
}

main();
