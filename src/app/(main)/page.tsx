import { ChatClient } from "@/components/chat/chat-client";

export default function HomePage() {
  // Panggil ChatClient tanpa initialMessages (karena ini chat baru)
  return <ChatClient />;
}
