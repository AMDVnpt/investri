"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Shell } from "../../components/Shell";

type Entitlement = {
  id: string;
  status: string;
  potentialCredit: string;
  certifiedCredit: string;
  user: { email: string; firstName: string; lastName: string };
  position: { offering: { name: string } };
};

type Queue = { remainingCap: string; entitlements: Entitlement[] };

function usd(value?: string | { toString(): string }) {
  return `$${String(value ?? "0").split(".")[0]}`;
}

export default function TaxCreditsPage() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [tab, setTab] = useState<"pending" | "certified" | "all">("pending");
  const [reason, setReason] = useState("Demo certification");
  const [reasonCode, setReasonCode] = useState("DEMO_POC");
  const [amount, setAmount] = useState("50.0000");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setQueue(await api<Queue>("/admin/tax-credits"));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const rows = (queue?.entitlements ?? []).filter((row) => {
    if (tab === "pending") return row.status.includes("pending");
    if (tab === "certified") return row.status === "certified";
    return true;
  });

  async function certify(id: string) {
    setError(null);
    try {
      await api(`/admin/tax-credits/${id}/certify`, {
        method: "POST",
        body: JSON.stringify({ reason, reasonCode, amount }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Certify failed");
    }
  }

  return (
    <Shell title="Tax credits">
      <p className="text-sm text-navy/70">
        Proposed program. Remaining statutory cap {usd(queue?.remainingCap)}. Certify requires a reason.
      </p>
      {Number(queue?.remainingCap ?? "0") < 100 ? (
        <p className="mt-3 text-risk text-sm">Remaining cap is low relative to a typical certificate.</p>
      ) : null}
      {error ? <p className="text-risk text-sm mt-4">{error}</p> : null}
      <div className="mt-6 flex gap-4 text-sm">
        {(["pending", "certified", "all"] as const).map((key) => (
          <button key={key} className={tab === key ? "underline" : "text-navy/70"} onClick={() => setTab(key)}>
            {key}
          </button>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4 max-w-3xl">
        <label className="block">
          <span className="label">Amount</span>
          <input className="mt-2 w-full border border-hairline bg-paper px-3 py-2" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Reason</span>
          <input className="mt-2 w-full border border-hairline bg-paper px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Reason code</span>
          <input className="mt-2 w-full border border-hairline bg-paper px-3 py-2" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} />
        </label>
      </div>
      <table className="mt-8 w-full text-sm border border-hairline bg-white">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="p-3">Investor</th>
            <th className="p-3">Offering</th>
            <th className="p-3">Status</th>
            <th className="p-3">Potential</th>
            <th className="p-3">Certified</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-hairline">
              <td className="p-3">
                {row.user.firstName} {row.user.lastName}
                <div className="text-navy/60">{row.user.email}</div>
              </td>
              <td className="p-3">{row.position.offering.name}</td>
              <td className="p-3">{row.status.replace(/_/g, " ")}</td>
              <td className="p-3">{usd(row.potentialCredit)}</td>
              <td className="p-3">{usd(row.certifiedCredit)}</td>
              <td className="p-3">
                <button className="border border-hairline px-3 py-2" onClick={() => certify(row.id)}>
                  Certify
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
