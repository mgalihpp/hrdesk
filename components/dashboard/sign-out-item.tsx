"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function SignOutItem() {
  const router = useRouter();

  return (
    <DropdownMenuItem
      className="gap-2.5 rounded-lg py-2.5 text-destructive focus:text-destructive"
      onSelect={async (event) => {
        event.preventDefault();
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => router.push("/login"),
          },
        });
      }}
    >
      <LogOut className="size-4 shrink-0" />
      Sign out
    </DropdownMenuItem>
  );
}
