"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Shell } from "../../components/Shell";

type Investor = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  residencyVerification: { status: string; city: string; state: string } | null;
  investorAccount: { positions: { id: string }[] } | null;
};

export default function InvestorsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Investor[]>([]);

  async function load(search = q) {
    const path = search ? `/admin/investors?q=${encodeURIComponent(search)}` : "/admin/investors";
    setRows(await api<Investor[]>(path));
  }

  useEffect(() => {
    load("").catch(() => undefined);
  }, []);

  return (
    <Shell title="Investors">
      <form
        className="flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          load().catch(() => undefined);
        }}
      >
        <input className="border border-hairline bg-paper px-3 py-2 w-80" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="border border-hairline px-4">Search</button>
      </form>
      <table className="mt-8 w-full text-sm border border-hairline bg-white">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Residency</th>
            <th className="p-3">Positions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-hairline">
              <td className="p-3">
                {row.firstName} {row.lastName}
              </td>
              <td className="p-3">{row.email}</td>
              <td className="p-3">
                {row.residencyVerification
                  ? `${row.residencyVerification.city}, ${row.residencyVerification.state} · ${row.residencyVerification.status}`
                  : "—"}
              </td>
              <td className="p-3">{row.investorAccount?.positions.length ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
