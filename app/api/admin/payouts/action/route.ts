import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { payoutId, action } = await request.json(); // action: 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 2. Process Payout
        if (action === 'approve') {
            // In a real Stripe Connect flow, we would trigger a Transfer here.
            // For now, we simulate success.

            await supabase
                .from('payouts')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', payoutId);

            // Update Transaction status too
            await supabase
                .from('transactions')
                .update({ status: 'completed' })
                .eq('reference_id', payoutId)
                .eq('type', 'payout');

        } else if (action === 'reject') {
            // Refund the wallet
            const { data: payout } = await supabase
                .from('payouts')
                .select('*')
                .eq('id', payoutId)
                .single();

            if (payout) {
                // Mark payout as rejected
                await supabase
                    .from('payouts')
                    .update({ status: 'rejected', updated_at: new Date().toISOString() })
                    .eq('id', payoutId);

                // Refund balance to Host Wallet
                // We need to fetch current balance first? Or use separate increment RPC? 
                // Let's read-update.
                const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', payout.host_id).single();

                if (wallet) {
                    await supabase
                        .from('wallets')
                        .update({ available_balance: wallet.available_balance + payout.amount })
                        .eq('user_id', payout.host_id);
                }

                // Update Transaction status
                await supabase
                    .from('transactions')
                    .update({ status: 'failed' }) // or rejected
                    .eq('reference_id', payoutId)
                    .eq('type', 'payout');
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Admin Payout Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
