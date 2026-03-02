import { getConversations } from "@/app/actions/messages";
import { ConversationList } from "@/components/messages/ConversationList";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function MessagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const conversations = await getConversations();

    return (
        <div className="flex flex-1 min-h-0 bg-[var(--card-bg)] rounded-2xl overflow-hidden border border-[var(--card-border)] -m-4 md:-m-8 mt-0">
            {/* Conversation list sidebar */}
            <div className="hidden md:block flex-none border-r border-[var(--card-border)]">
                <ConversationList initialConversations={conversations} userId={user.id} />
            </div>

            {/* Chat area */}
            <main className="flex-1 flex flex-col min-w-0 min-h-0">
                {children}
            </main>
        </div>
    );
}
