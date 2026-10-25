"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (pending) return; // double-submit guard (frontend-craft skill)
    setPending(true);
    try {
      const res = await fetch("/api/auth/signout", { method: "POST" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="ghost" onClick={signOut} disabled={pending} className="min-h-11 px-3">
      <LogOut size={16} aria-hidden />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}
