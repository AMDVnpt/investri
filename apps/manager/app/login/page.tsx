"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("manager@demo.investri.ri");
  const [password, setPassword] = useState("DemoPass123!");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch(`${API}/api/v1/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-Client": "web" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setError("Unable to sign in");
      return;
    }
    router.push("/home");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-hairline bg-white p-10">
        <p className="label">Fund manager</p>
        <h1 className="font-display text-4xl mt-3">InvestRI</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <input className="w-full border border-hairline bg-paper px-3 py-3" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="w-full border border-hairline bg-paper px-3 py-3" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <p className="text-sm text-risk">{error}</p> : null}
          <button className="w-full bg-navy text-white py-3">Sign in</button>
        </form>
      </div>
    </main>
  );
}
