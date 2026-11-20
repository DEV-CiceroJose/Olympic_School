import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { PlatformLayout } from "@/components/layout/platform-layout";
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
  return (
    <RequireAuth>
      <ChatProvider>
        <PlatformLayout
          assistant
          renderHeader={(header) => <ChatHeader {...header} />}
          sidebar={(onNavigate) => <ChatSidebar onNavigate={onNavigate} />}
        >
          <Outlet />
        </PlatformLayout>
      </ChatProvider>
    </RequireAuth>
  );
}
