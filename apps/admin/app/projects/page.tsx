"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Shell } from "../../components/Shell";

type Project = {
  id: string;
  name: string;
  sector: string;
  locations: { municipality: string }[];
  investments: { amountDeployed: string }[];
};

export default function AdminProjectsPage() {
  const [rows, setRows] = useState<Project[]>([]);

  useEffect(() => {
    api<Project[]>("/admin/projects").then(setRows).catch(() => undefined);
  }, []);

  return (
    <Shell title="Projects">
      <table className="w-full text-sm border border-hairline bg-white">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="p-3">Project</th>
            <th className="p-3">Place</th>
            <th className="p-3">Sector</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-hairline">
              <td className="p-3">{row.name}</td>
              <td className="p-3">{row.locations[0]?.municipality ?? "—"}</td>
              <td className="p-3">{row.sector}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
