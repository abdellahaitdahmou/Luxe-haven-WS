import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, methodId } = await request.json(); // methodId for user_payout_methods

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // 2. Check Balance (Ensure enough AVAILABLE balance)
        const { data: wallet } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        if (wallet.available_balance < amount) {
            return NextResponse.json({ error: 'Insufficient available balance' }, { status: 400 });
        }

        // 3. Create Payout Request
        // We should use a transaction via RPC if possible, but sequential updates work for MVP if error handling is robust.

        // Create Payout Record
        const { data: payout, error: payoutError } = await supabase
            .from('payouts')
            .insert({
                host_id: user.id,
                amount: amount,
                status: 'pending',
                // method_id: methodId // If we add this column to track which method used
            })
            .select()
            .single();

        if (payoutError) throw payoutError;

        // Deduct from Wallet
        const { error: walletError } = await supabase
            .from('wallets')
            .update({
                available_balance: wallet.available_balance - amount
            })
            .eq('user_id', user.id);

        if (walletError) {
            // Rollback payout creation (or mark failed)
            await supabase.from('payouts').delete().eq('id', payout.id);
            throw walletError;
        }

        // Create Transaction Record (Debit)
        await supabase.from('transactions').insert({
            booking_id: null, // It's a payout, not booking
            amount: -amount, // Negative for withdrawal? or just positive with type='payout'
            platform_fee: 0,
            owner_payout: amount,
            status: 'pending',
            type: 'payout',
            reference_id: payout.id
        });

        return NextResponse.json({ success: true, payout });

    } catch (error: any) {
        console.error('Payout Request Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
