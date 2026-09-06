"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type SessionUser } from "../../lib/api";
import { Shell } from "../../components/Shell";

type Dashboard = {
  illustrative: boolean;
  citizens: number;
  verifiedResidents: number;
  activeInvestors: number;
  liveOfferings: number;
  capital: { committed: string; settled: string; deployed: string; distributions: string };
  taxCredits: { reserved: string; certified: string; remainingCap: string };
  complianceExceptions: number;
  municipalities: { name: string; amount: string }[];
};

function usd(value?: string) {
  return `$${(value ?? "0").split(".")[0]}`;
}

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<SessionUser>("/admin/me")
      .then(setUser)
      .catch((err: Error) => setError(err.message));
    api<Dashboard>("/admin/dashboard")
      .then(setDash)
      .catch(() => undefined);
  }, []);

  return (
    <Shell title="InvestRI Console">
      {error ? (
        <p className="text-risk text-sm">
          {error}.{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      ) : (
        <p className="text-sm text-navy/70">
          Signed in as {user?.firstName} {user?.lastName} · {user?.roles.join(", ")}
        </p>
      )}
      {dash ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            <Stat label="Citizens" value={String(dash.citizens)} />
            <Stat label="Verified RI residents" value={String(dash.verifiedResidents)} />
            <Stat label="Active investors" value={String(dash.activeInvestors)} />
            <Stat label="Live offerings" value={String(dash.liveOfferings)} />
            <Stat label="Settled capital" value={usd(dash.capital.settled)} />
            <Stat label="Credits reserved" value={usd(dash.taxCredits.reserved)} />
            <Stat label="Credits certified" value={usd(dash.taxCredits.certified)} />
            <Stat label="Remaining cap" value={usd(dash.taxCredits.remainingCap)} />
          </div>
          <p className="mt-8 text-sm text-navy/70">All figures are illustrative. Program status is proposed.</p>
          <table className="mt-8 w-full text-sm border border-hairline bg-white">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="p-3">Municipality</th>
                <th className="p-3">Deployed</th>
              </tr>
            </thead>
            <tbody>
              {dash.municipalities.map((row) => (
                <tr key={row.name} className="border-b border-hairline">
                  <td className="p-3">{row.name}</td>
                  <td className="p-3">{usd(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-hairline bg-white p-6">
      <p className="label">{label}</p>
      <p className="font-display text-3xl mt-3">{value}</p>
    </div>
  );
}
