import { getMessages, getConversation } from "@/app/actions/messages";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ConversationPage({
    params,
}: {
    params: Promise<{ conversationId: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { conversationId } = await params;

    const [messages, conversation] = await Promise.all([
        getMessages(conversationId),
        getConversation(conversationId),
    ]);

    if (!conversation) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm gap-2">
                <span className="text-2xl">💬</span>
                Conversation not found or you don&apos;t have access.
            </div>
        );
    }

    return (
        <ChatWindow
            conversationId={conversationId}
            initialMessages={messages}
            currentUserId={user.id}
            isOwner={conversation.isOwner}
            otherUser={conversation.otherUser}
            property={conversation.property}
        />
    );
}
