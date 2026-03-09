import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { is_banned } = await request.json();

        // We need the service role key to bypass RLS and use auth.admin methods
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: 'Server configuration error: Missing Supabase Service Role Key' },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Update the auth.users ban_duration
        // 87600h = 10 years (effectively a permanent ban)
        const banDuration = is_banned ? '87600h' : 'none';

        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            ban_duration: banDuration
        });

        if (banError) {
            console.error('Error updating user ban status in auth:', banError);
            return NextResponse.json({ error: banError.message }, { status: 400 });
        }

        // 2. Update the public.profiles is_banned status so it shows in the UI
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ is_banned })
            .eq('id', id);

        if (profileError) {
            console.error('Error updating profile is_banned status:', profileError);
            return NextResponse.json({ error: profileError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, is_banned });

    } catch (error: any) {
        console.error('Failed to update ban status:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
