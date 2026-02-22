"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function uploadIdentityDocument(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "User not authenticated" };
    }

    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file || !documentType) {
        return { error: "Missing file or document type" };
    }

    // validate document type
    if (!['passport', 'id_card'].includes(documentType)) {
        return { error: "Invalid document type" };
    }

    try {
        // 1. Upload file to Supabase Storage (Private Bucket)
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('private-documents')
            .upload(filePath, file);

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            return { error: "Failed to upload document" };
        }

        // 2. Insert record into database
        const { error: dbError } = await supabase
            .from('identity_documents')
            .insert({
                user_id: user.id,
                document_type: documentType,
                document_url: filePath,
                status: 'pending' // Default status
            });

        if (dbError) {
            console.error("DB Error:", dbError);
            return { error: "Failed to save document record" };
        }

        // 3. Update Verification Status in Profile (Optional, but good for quick checks)
        // For now, we rely on the existence of a 'verified' or 'pending' document.

        revalidatePath('/dashboard');
        return { success: true };

    } catch (error) {
        console.error("Unexpected Error:", error);
        return { error: "An unexpected error occurred" };
    }
}

export async function getVerificationStatus() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
        .from('identity_documents')
        .select('status, rejection_reason, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    return data;
}
