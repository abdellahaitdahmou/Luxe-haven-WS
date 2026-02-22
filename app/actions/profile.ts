"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const full_name = formData.get("fullName") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    // Hobbies and Languages will be passed as JSON strings or comma-separated
    const hobbiesRaw = formData.get("hobbies") as string;
    const languagesRaw = formData.get("languages") as string;

    const safeParseArray = (raw: string | null): string[] => {
        if (!raw || raw.trim() === "" || raw === "undefined" || raw === "null") return [];
        try { return JSON.parse(raw); } catch { return []; }
    };
    const hobbies = safeParseArray(hobbiesRaw);
    const languages = safeParseArray(languagesRaw);


    const { error } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            full_name,
            bio,
            location,
            hobbies,
            languages,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error("Profile Update Error:", error);
        return { error: error.message };
    }

    revalidatePath("/dashboard/settings");
    revalidatePath(`/users/${user.id}`);
    revalidatePath("/dashboard", "layout"); // Update header
    revalidatePath("/admin/profile");
    revalidatePath("/admin", "layout");
    return { success: true };
}

export async function updateProfileAvatar(avatarUrl: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error("Avatar Update Error:", error);
        return { error: "Failed to update avatar" };
    }

    revalidatePath("/dashboard/settings");
    revalidatePath(`/users/${user.id}`);
    revalidatePath("/dashboard", "layout"); // Update header if avatar is there
    revalidatePath("/admin/profile");
    revalidatePath("/admin", "layout");
    return { success: true };
}

export async function getProfile(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) return null;
    return data;
}
