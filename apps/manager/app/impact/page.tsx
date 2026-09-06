"use client";

import { FormEvent, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Project = { id: string; name: string };

export default function ManagerImpactPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [definitionKey, setDefinitionKey] = useState("jobs");
  const [value, setValue] = useState("1.0000");
  const [source, setSource] = useState("Manager report");
  const [period, setPeriod] = useState("2026");
  const [evidenceUrl, setEvidenceUrl] = useState("https://example.com/evidence");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/manager/projects`, { credentials: "include", headers: { "X-Client": "web" } })
      .then((res) => res.json())
      .then((rows: Project[]) => {
        setProjects(rows);
        setProjectId(rows[0]?.id ?? "");
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(`${API}/api/v1/manager/projects/${projectId}/impact`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-Client": "web" },
      body: JSON.stringify({ definitionKey, value, source, period, evidenceUrl }),
    });
    setMessage(response.ok ? "Submitted for verification" : "Submit failed");
  }

  return (
    <main className="min-h-screen px-8 py-10">
      <p className="label">Manager portal</p>
      <h1 className="font-display text-4xl mt-2">Impact submission</h1>
      <ul className="mt-8 text-sm">
        {projects.map((project) => (
          <li key={project.id} className="border-b border-hairline py-3">
            {project.name}
          </li>
        ))}
      </ul>
      <form onSubmit={onSubmit} className="mt-10 max-w-lg space-y-4">
        <select className="w-full border border-hairline bg-paper px-3 py-2" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <input className="w-full border border-hairline bg-paper px-3 py-2" value={definitionKey} onChange={(e) => setDefinitionKey(e.target.value)} />
        <input className="w-full border border-hairline bg-paper px-3 py-2" value={value} onChange={(e) => setValue(e.target.value)} />
        <input className="w-full border border-hairline bg-paper px-3 py-2" value={source} onChange={(e) => setSource(e.target.value)} />
        <input className="w-full border border-hairline bg-paper px-3 py-2" value={period} onChange={(e) => setPeriod(e.target.value)} />
        <input className="w-full border border-hairline bg-paper px-3 py-2" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} />
        {message ? <p className="text-sm">{message}</p> : null}
        <button className="bg-navy text-white px-4 py-2 text-sm">Submit metric</button>
      </form>
    </main>
  );
}
