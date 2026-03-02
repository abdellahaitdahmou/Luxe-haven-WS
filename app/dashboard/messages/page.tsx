import { getConversations } from "@/app/actions/messages";
import { ConversationList } from "@/components/messages/ConversationList";
import { createClient } from "@/utils/supabase/server";
import { MessageCircle } from "lucide-react";

export default async function MessagesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const conversations = await getConversations();

    return (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-[var(--muted-text)]">
            <div className="w-16 h-16 bg-[var(--surface-100)] rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gold-500" />
            </div>
            <h3 className="text-xl font-bold text-[var(--page-text)] mb-2">Select a conversation</h3>
            <p className="max-w-md">Choose a conversation from the list to start chatting.</p>
        </div>
    );
}
