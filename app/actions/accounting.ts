"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ExpenseParams = {
    description: string;
    amount: number;
    date: string;
    payment_method: 'cash' | 'personal_virement' | 'society_virement';
    property_name?: string;
    category?: string;
};

export type ReceivedPaymentParams = {
    amount: number;
    date: string;
    motif: string;
    from_whom: string;
    payment_method: 'cash' | 'virement';
    received_by?: string; // profile_id
    property_name?: string;
    category?: string;
    // New booking-detail fields (from Airbnb CSV)
    check_out_date?: string;
    guests?: number;
    channel?: string;
    nights?: number;
    price_per_night?: number;
};

export async function createExpense(params: ExpenseParams) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("expenses")
        .insert({
            ...params,
            created_by: user.id
        });

    if (error) {
        console.error("Error creating expense:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin/accounting/expenses");
    return { success: true };
}

export async function importExpenses(expenses: ExpenseParams[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("expenses")
        .insert(expenses.map(e => ({
            ...e,
            created_by: user.id
        })));

    if (error) {
        console.error("Error importing expenses:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin/accounting/expenses");
    return { success: true };
}

export async function deleteExpenses(ids: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Chunk the deletions to avoid potential request size or parameter limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase
            .from("expenses")
            .delete()
            .in("id", chunk);

        if (error) {
            console.error(`Error deleting chunk ${i / CHUNK_SIZE}:`, error);
            throw new Error(error.message);
        }
    }

    revalidatePath("/admin/accounting/expenses");
    return { success: true };
}

export async function updateExpense(id: string, params: Partial<ExpenseParams>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("expenses")
        .update(params)
        .eq("id", id);

    if (error) {
        console.error("Error updating expense:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin/accounting/expenses");
    return { success: true };
}

export async function createReceivedPayment(params: ReceivedPaymentParams) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("received_payments")
        .insert({
            ...params,
            received_by: params.received_by || user.id,
            created_by: user.id
        });

    if (error) {
        console.error("Error creating received payment:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin/accounting/payments");
    return { success: true };
}

export async function importReceivedPayments(payments: ReceivedPaymentParams[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("received_payments")
        .insert(payments.map(p => ({
            ...p,
            received_by: p.received_by || user.id,
            created_by: user.id
        })));

    if (error) {
        console.error("Error importing payments:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin/accounting/payments");
    return { success: true };
}

export async function updateReceivedPayment(id: string, params: Partial<ReceivedPaymentParams>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("received_payments")
        .update(params)
        .eq("id", id);

    if (error) {
        console.error("Error updating received payment:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin/accounting/payments");
    return { success: true };
}

export async function deleteReceivedPayments(ids: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const CHUNK_SIZE = 100;
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase
            .from("received_payments")
            .delete()
            .in("id", chunk);

        if (error) {
            console.error(`Error deleting chunk ${i / CHUNK_SIZE}:`, error);
            throw new Error(error.message);
        }
    }

    revalidatePath("/admin/accounting/payments");
    return { success: true };
}

export async function getExpenses() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("expenses")
        .select(`
            *,
            profiles:created_by (full_name, email)
        `)
        .order("date", { ascending: false });

    if (error) {
        console.error("Error fetching expenses:", error);
        throw new Error(error.message);
    }

    return data;
}

export async function getReceivedPayments() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("received_payments")
        .select(`
            *,
            recipient:received_by (full_name, email),
            creator:created_by (full_name, email)
        `)
        .order("date", { ascending: false });

    if (error) {
        console.error("Error fetching received payments:", error);
        throw new Error(error.message);
    }

    return data;
}

export async function getAllManagersAndAdmins() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", ["admin", "manager"])
        .order("full_name");

    if (error) {
        console.error("Error fetching managers:", error);
        throw new Error(error.message);
    }

    return data;
}
