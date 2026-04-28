"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function SignOutButton({ variant = "button" }: { variant?: "button" | "link" }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  if (variant === "link") {
    return (
      <button
        onClick={handleSignOut}
        className="text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors"
      >
        Cerrar sesión
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
    >
      Cerrar sesión
    </button>
  );
}