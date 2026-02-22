import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch the most recent profile
        const { data: latestProfile, error } = await supabase
            .from('profiles')
            .select('id, email, role, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            return NextResponse.json({
                status: 'error',
                message: 'Failed to fetch latest profile.',
                details: error
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'success',
            message: 'Latest user profile fetched.',
            user: latestProfile
        });

    } catch (err: any) {
        return NextResponse.json({
            status: 'error',
            message: 'Unexpected error.',
            details: err.message
        }, { status: 500 });
    }
}
