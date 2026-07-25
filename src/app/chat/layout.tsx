import { EvnHeader } from "@/components/shared/evn-header";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--color-bg-page)]">
      <EvnHeader />
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
