"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { updateProfile } from "@/app/actions/profile";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface ProfileEditFormProps {
    user: any; // Auth user
    profile: any; // Profile data
}

export function ProfileEditForm({ user, profile }: ProfileEditFormProps) {
    const [loading, setLoading] = useState(false);
    const [hobbies, setHobbies] = useState<string[]>(profile?.hobbies || []);
    const [languages, setLanguages] = useState<string[]>(profile?.languages || []);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append("hobbies", JSON.stringify(hobbies));
        formData.append("languages", JSON.stringify(languages));

        const result = await updateProfile(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Profile updated successfully!");
            router.refresh(); // Refresh server components (header, etc.) without full reload
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">Full Name</Label>
                <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || ""}
                    className="bg-surface-50 border-white/10 text-white"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="location" className="text-white">Location <span className="text-gray-500 text-xs ml-1">(Optional)</span></Label>
                <Input
                    id="location"
                    name="location"
                    defaultValue={profile?.location || ""}
                    placeholder="e.g. Paris, France"
                    className="bg-surface-50 border-white/10 text-white"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio" className="text-white">Bio <span className="text-gray-500 text-xs ml-1">(Optional)</span></Label>
                <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={profile?.bio || ""}
                    placeholder="Tell us about yourself..."
                    className="bg-surface-50 border-white/10 text-white min-h-[120px]"
                />
                <p className="text-xs text-gray-400">Share a little about yourself, your travel style, or what you love about hosting.</p>
            </div>

            <div className="space-y-2">
                <Label className="text-white">Languages Spoken <span className="text-gray-500 text-xs ml-1">(Optional)</span></Label>
                <TagInput
                    placeholder="Add a language (e.g. English, French)"
                    tags={languages}
                    setTags={setLanguages}
                />
            </div>

            <div className="space-y-2">
                <Label className="text-white">Hobbies & Interests <span className="text-gray-500 text-xs ml-1">(Optional)</span></Label>
                <TagInput
                    placeholder="Add a hobby (e.g. Photography, Hiking)"
                    tags={hobbies}
                    setTags={setHobbies}
                />
            </div>

            <Button type="submit" disabled={loading} className="bg-gold-500 text-black hover:bg-gold-400 font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
            </Button>
        </form>
    );
}
