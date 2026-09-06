"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Shell } from "../../components/Shell";

type Program = {
  id: string;
  name: string;
  status: string;
  creditRate: string;
  vestingMethod: string;
  totalProgramCap: string | null;
  disclaimerKey: string;
};

export default function ProgramsPage() {
  const [rows, setRows] = useState<Program[]>([]);

  useEffect(() => {
    api<Program[]>("/admin/programs").then(setRows).catch(() => undefined);
  }, []);

  return (
    <Shell title="Programs">
      <p className="text-sm text-navy/70">Read-only program configuration.</p>
      {rows.map((row) => (
        <article key={row.id} className="mt-8 border border-hairline bg-white p-6">
          <p className="label">{row.status}</p>
          <h2 className="font-display text-3xl mt-2">{row.name}</h2>
          <p className="mt-3 text-sm">
            Rate {String(row.creditRate)} · {row.vestingMethod} · Cap {String(row.totalProgramCap ?? "—")}
          </p>
          <p className="mt-2 text-sm text-navy/70">Disclaimer key: {row.disclaimerKey}</p>
        </article>
      ))}
    </Shell>
  );
}
