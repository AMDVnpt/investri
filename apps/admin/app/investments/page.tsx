"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Shell } from "../../components/Shell";

type Order = {
  id: string;
  status: string;
  requestedAmount: string;
  offering: { name: string };
  account: { user: { email: string; firstName: string; lastName: string } };
};

export default function InvestmentsPage() {
  const [rows, setRows] = useState<Order[]>([]);

  useEffect(() => {
    api<Order[]>("/admin/investments").then(setRows).catch(() => undefined);
  }, []);

  return (
    <Shell title="Investments">
      <table className="w-full text-sm border border-hairline bg-white">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="p-3">Investor</th>
            <th className="p-3">Offering</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-hairline">
              <td className="p-3">
                {row.account.user.firstName} {row.account.user.lastName}
                <div className="text-navy/60">{row.account.user.email}</div>
              </td>
              <td className="p-3">{row.offering.name}</td>
              <td className="p-3">${String(row.requestedAmount).split(".")[0]}</td>
              <td className="p-3">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
