"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("reviewer@commerce.ri.gov");
  const [password, setPassword] = useState("DemoPass123!");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-hairline bg-white p-10">
        <p className="label">Commerce Console</p>
        <h1 className="font-display text-4xl mt-3">InvestRI</h1>
        <p className="mt-3 text-sm text-navy/70">
          Sign in to review offerings, program caps, and tax-credit queues. This is a demonstration.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="label">Email</span>
            <input
              className="mt-2 w-full border border-hairline bg-paper px-3 py-3 outline-none"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input
              type="password"
              className="mt-2 w-full border border-hairline bg-paper px-3 py-3 outline-none"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm text-risk">{error}</p> : null}
          <button className="w-full bg-navy text-white py-3 text-sm tracking-wide">Sign in</button>
        </form>
      </div>
    </main>
  );
}
