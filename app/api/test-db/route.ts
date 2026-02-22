import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Check profiles email column
        const { data: profileCheck, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .limit(1);

        // 2. Check user_invitations table
        const { data: invitationsCheck, error: invitationsError } = await supabase
            .from('user_invitations')
            .select('id')
            .limit(1);

        // 3. Check logs for errors (if table exists)
        // We use maybeSingle to avoid error if table missing (though .select('*') returns [], so it's fine)
        const { data: signupErrors, error: errorsError } = await supabase
            .from('signup_errors')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(3);

        return NextResponse.json({
            status: 'diagnostic_complete',
            message: 'Check JSON below for errors.',
            latest_error_logs: signupErrors || [],
            results: {
                profiles: {
                    ok: !profileError,
                    details: profileError ? profileError.message : 'Table accessible',
                    sample: profileCheck
                },
                user_invitations: {
                    ok: !invitationsError || (invitationsError.code !== '42P01'),
                    details: invitationsError ? invitationsError.message : 'Table accessible or exists'
                },
                logs_table: {
                    ok: !errorsError || (errorsError.code !== '42P01'),
                    details: errorsError ? errorsError.message : 'Table accessible'
                }
            }
        });

    } catch (err: any) {
        return NextResponse.json({
            status: 'error',
            message: 'Unexpected error during diagnostic check.',
            details: err.message
        }, { status: 500 });
    }
}
