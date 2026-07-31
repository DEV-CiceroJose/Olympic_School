import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChatProvider } from "@/hooks/use-chat-store";
import { RequireAuth } from "@/components/auth/require-auth";
const title = "Assistente Olympic School — Estudo de Biologia com IA";
const description =
  "Converse com o assistente da Olympic School para organizar seus estudos de Olimpíadas Científicas de Biologia. Protótipo de interface em desenvolvimento.";
export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatLayout,
});
function ChatLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <RequireAuth>
      <ChatProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <aside className="hidden w-72 shrink-0 border-r border-sidebar-border md:block">
            <ChatSidebar />
          </aside>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-72 border-sidebar-border p-0">
              <ChatSidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col">
            <ChatHeader onOpenSidebar={() => setMobileOpen(true)} />
            <Outlet />
          </div>
        </div>
      </ChatProvider>
    </RequireAuth>
  );
}
