"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Camera, Loader2, Upload, Pencil, ZoomIn, X } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAvatar } from "@/app/actions/profile"; // We need to add this action
import Image from "next/image";

interface AvatarUploadProps {
    uid: string;
    url: string | null;
    currentName: string;
}

export function AvatarUpload({ uid, url, currentName }: AvatarUploadProps) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(url);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isZoomed, setIsZoomed] = useState(false);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("You must select an image to upload.");
            }

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `${uid}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const supabase = createClient();

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

            // Update Profile via Server Action
            const result = await updateProfileAvatar(publicUrl);

            if (result.error) {
                throw new Error(result.error);
            }

            setAvatarUrl(publicUrl);
            toast.success("Avatar updated!");

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <div className="relative w-32 h-32 mb-4 group">
                <div
                    className="w-full h-full rounded-full bg-surface-200 overflow-hidden relative cursor-pointer"
                    onClick={() => avatarUrl ? setIsZoomed(true) : fileInputRef.current?.click()}
                >
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt="Avatar"
                            fill
                            className={`object-cover rounded-full transition-opacity ${uploading ? 'opacity-50' : ''}`}
                            sizes="128px"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500 bg-surface-100">
                            {currentName?.charAt(0) || "U"}
                        </div>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                        </div>
                    )}

                    {/* Hover Overlay - Zoom Hint if image exists, else Upload */}
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {avatarUrl ? <ZoomIn className="w-8 h-8 text-white" /> : <Upload className="w-8 h-8 text-white" />}
                    </div>
                </div>

                <button
                    type="button"
                    className="absolute bottom-0 right-0 p-2 bg-surface-100 rounded-full border border-white/10 hover:bg-white/10 transition-colors z-10"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {avatarUrl ? <Pencil className="w-4 h-4 text-white" /> : <Camera className="w-4 h-4 text-white" />}
                </button>

                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                    ref={fileInputRef}
                    disabled={uploading}
                />
            </div>

            {/* Lightbox / Zoom Modal */}
            {isZoomed && avatarUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    onClick={() => setIsZoomed(false)}
                >
                    <div className="relative max-w-4xl max-h-screen w-full h-full flex items-center justify-center p-4">
                        <div className="relative w-full h-full max-w-[80vw] max-h-[80vh]">
                            <Image
                                src={avatarUrl}
                                alt="Avatar Zoomed"
                                fill
                                className="object-contain rounded-lg shadow-2xl border border-white/10"
                                sizes="100vw"
                                quality={100}
                            />
                        </div>
                        <button
                            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors"
                            onClick={() => setIsZoomed(false)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
