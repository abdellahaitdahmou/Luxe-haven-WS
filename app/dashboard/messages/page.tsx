import { getConversations } from "@/app/actions/messages";
import { ConversationList } from "@/components/messages/ConversationList";
import { createClient } from "@/utils/supabase/server";
import { MessageCircle } from "lucide-react";

export default async function MessagesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const conversations = await getConversations();

    return (
        <div className="h-full flex flex-col md:flex-row">
            {/* Mobile Only: Show Conversation List here since layout hides it on mobile default  */}
            <div className="md:hidden w-full flex-1">
                <ConversationList initialConversations={conversations} userId={user?.id || ""} />
            </div>

            {/* Desktop Only: Empty State */}
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-gray-500">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-gold-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Select a conversation</h3>
                <p className="max-w-md">
                    Choose a conversation from the list to start chatting with hosts or guests.
                </p>
            </div>
        </div>
    );
}
