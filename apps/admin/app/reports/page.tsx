"use client";

import { useEffect, useState } from "react";
import { Shell } from "../../components/Shell";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function ReportsPage() {
  const [csv, setCsv] = useState("");

  useEffect(() => {
    fetch(`${API}/api/v1/admin/reports`, { credentials: "include", headers: { "X-Client": "web" } })
      .then((res) => res.text())
      .then(setCsv)
      .catch(() => setCsv(""));
  }, []);

  return (
    <Shell title="Reports">
      <p className="text-sm text-navy/70">Capital by municipality and tax-credit cap usage. Illustrative.</p>
      <a
        className="inline-block mt-6 underline text-sm"
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
        download="investri-report.csv"
      >
        Download CSV
      </a>
      <pre className="mt-8 border border-hairline bg-white p-4 text-xs overflow-auto">{csv}</pre>
    </Shell>
  );
}
