"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, FieldHint, Spinner } from "@/components/ui";

type State = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("checking");
  const [loading, setLoading] = useState(false);

  // The recovery link lands here via /auth/callback, which exchanges the code
  // for a session. No session = the link was expired, reused, or opened cold.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? "ready" : "invalid");
    });
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. You're signed in.");
    router.push("/dashboard");
    router.refresh();
  }

  if (state === "checking") {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold text-ink">This link has expired</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Password reset links are single-use and expire after an hour. Request a fresh one and
          try again.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
        >
          Send a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Choose a new password</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" />
          <FieldHint>At least 8 characters.</FieldHint>
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" />
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Update password
        </Button>
      </form>
    </div>
  );
}
