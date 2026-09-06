"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Shell } from "../../components/Shell";

type Report = {
  id: string;
  verificationStatus: string;
  value: string;
  source: string;
  period: string;
  project: { name: string };
  definition: { label: string };
};

export default function AdminImpactPage() {
  const [rows, setRows] = useState<Report[]>([]);
  const [reason, setReason] = useState("Demo verification");
  const [reasonCode, setReasonCode] = useState("DEMO_POC");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const list = await api<Report[]>("/admin/impact");
    setRows(
      [...list].sort((a, b) => {
        if (a.verificationStatus === "PENDING_VERIFICATION") return -1;
        if (b.verificationStatus === "PENDING_VERIFICATION") return 1;
        return 0;
      }),
    );
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function act(id: string, action: "verify" | "reject") {
    setError(null);
    try {
      await api(`/admin/impact/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ reason, reasonCode }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <Shell title="Impact queue">
      <p className="text-sm text-navy/70">Verify or reject manager-submitted metrics. Reason required.</p>
      {error ? <p className="text-risk text-sm mt-4">{error}</p> : null}
      <div className="mt-6 grid grid-cols-2 gap-4 max-w-xl">
        <input className="border border-hairline bg-paper px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)} />
        <input className="border border-hairline bg-paper px-3 py-2" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} />
      </div>
      <table className="mt-8 w-full text-sm border border-hairline bg-white">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="p-3">Project</th>
            <th className="p-3">Metric</th>
            <th className="p-3">Value</th>
            <th className="p-3">Status</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-hairline">
              <td className="p-3">{row.project.name}</td>
              <td className="p-3">{row.definition.label}</td>
              <td className="p-3">{String(row.value)}</td>
              <td className="p-3">{row.verificationStatus.replace(/_/g, " ")}</td>
              <td className="p-3 flex gap-2">
                <button className="border border-hairline px-3 py-1" onClick={() => act(row.id, "verify")}>
                  Verify
                </button>
                <button className="border border-hairline px-3 py-1" onClick={() => act(row.id, "reject")}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
