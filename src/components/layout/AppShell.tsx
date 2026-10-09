import type { ReactNode } from "react";
import type { SessionUser } from "@/types/domain";
import { AppProviders } from "./AppProviders";
import { AppHeader } from "./AppHeader";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-parchment">
      <AppHeader user={user} />
      <main className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6 md:py-8">
        <AppProviders>{children}</AppProviders>
      </main>
    </div>
  );
}
