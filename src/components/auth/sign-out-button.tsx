"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({
  redirectTo = "/",
  ...props
}: { redirectTo?: string } & Omit<
  React.ComponentProps<typeof Button>,
  "onClick"
>) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await authClient.signOut();
    router.push(redirectTo);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={loading}
      {...props}
    >
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  );
}
