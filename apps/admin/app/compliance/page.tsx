"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Shell } from "../../components/Shell";

type Exception = {
  kind: string;
  email: string;
  name: string;
  status: string;
  reason: string | null;
};

export default function CompliancePage() {
  const [rows, setRows] = useState<Exception[]>([]);

  useEffect(() => {
    api<Exception[]>("/admin/compliance").then(setRows).catch(() => undefined);
  }, []);

  return (
    <Shell title="Compliance">
      <p className="text-sm text-navy/70">Failed KYC, residency, and suitability checks. No SSN values are shown.</p>
      <table className="mt-8 w-full text-sm border border-hairline bg-white">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="p-3">Kind</th>
            <th className="p-3">Investor</th>
            <th className="p-3">Status</th>
            <th className="p-3">Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.kind}-${row.email}`} className="border-b border-hairline">
              <td className="p-3">{row.kind}</td>
              <td className="p-3">
                {row.name}
                <div className="text-navy/60">{row.email}</div>
              </td>
              <td className="p-3">{row.status}</td>
              <td className="p-3">{row.reason ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
