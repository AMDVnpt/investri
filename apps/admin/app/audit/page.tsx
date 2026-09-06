"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Shell } from "../../components/Shell";

type Event = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorRole: string | null;
  reasonCode: string | null;
  createdAt: string;
};

export default function AuditPage() {
  const [rows, setRows] = useState<Event[]>([]);

  useEffect(() => {
    api<Event[]>("/admin/audit-events").then(setRows).catch(() => undefined);
  }, []);

  return (
    <Shell title="Audit log">
      <p className="text-sm text-navy/70">Append-only. Newest first. Events cannot be edited.</p>
      <table className="mt-8 w-full text-sm border border-hairline bg-white">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="p-3">When</th>
            <th className="p-3">Action</th>
            <th className="p-3">Entity</th>
            <th className="p-3">Role</th>
            <th className="p-3">Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-hairline">
              <td className="p-3">{new Date(row.createdAt).toLocaleString()}</td>
              <td className="p-3">{row.action}</td>
              <td className="p-3">
                {row.entityType} · {row.entityId.slice(0, 8)}
              </td>
              <td className="p-3">{row.actorRole ?? "—"}</td>
              <td className="p-3">{row.reasonCode ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
