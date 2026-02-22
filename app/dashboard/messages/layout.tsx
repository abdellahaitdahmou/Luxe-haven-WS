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
        <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] bg-black rounded-tl-2xl overflow-hidden border border-white/10 m-0 md:m-4 md:mr-0">
            {/* Sidebar list - hidden on mobile if children (chat) is active? 
                Actually, simpler to just start with standard layout and adjust with CSS if needed.
                For now, sidebar is always visible on desktop.
                On mobile, we might need logic to hide it when a chat is open.
            */}
            <div className="w-full md:w-auto md:flex-none border-r border-white/10 hidden md:block">
                <ConversationList initialConversations={conversations} userId={user.id} />
            </div>

            {/* Mobile: Show list only if we are at /messages root (conceptually)
                But layout renders children. 
                We'll handle mobile visibility via CSS classes in page.tsx or here.
                Let's use a simple approach: 
                If on mobile, we show Children if route is /messages/id, else List.
                Since Layout doesn't know pathname easily without client component...
                
                Actually, let's just render both and use CSS classes for mobile toggling if possible, 
                or rely on the user navigating.
            */}

            <main className="flex-1 flex flex-col min-w-0 bg-surface-50/50">
                {children}
            </main>
        </div>
    );
}
