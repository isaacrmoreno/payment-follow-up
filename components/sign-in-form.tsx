"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignInForm() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        const value = String(formData.get("email") ?? "").trim();
        setMessage("");

        startTransition(async () => {
          const { error } = await supabase.auth.signInWithOtp({
            email: value,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) {
            setMessage(error.message);
            return;
          }

          setMessage("Check your email for the magic link.");
        });
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-700">Work email</span>
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          placeholder="you@company.com"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send magic link"}
      </button>
      <p className="text-sm text-zinc-600">{message}</p>
    </form>
  );
}
