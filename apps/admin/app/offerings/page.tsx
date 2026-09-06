"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Shell } from "../../components/Shell";

type Offering = {
  id: string;
  name: string;
  status: string;
  category: string;
  raisedAmount: string;
  isIllustrative: boolean;
};

export default function OfferingsPage() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [reason, setReason] = useState("Demo workflow");
  const [reasonCode, setReasonCode] = useState("DEMO_POC");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setOfferings(await api<Offering[]>("/admin/offerings"));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function act(id: string, action: "approve" | "pause" | "request-changes", event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api(`/admin/offerings/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ reason, reasonCode }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <Shell title="Offerings">
      <p className="text-sm text-navy/70">Approve, request changes, or pause. Reason is required.</p>
      {error ? <p className="text-risk text-sm mt-4">{error}</p> : null}
      <div className="mt-6 grid grid-cols-2 gap-4 max-w-xl">
        <label className="block">
          <span className="label">Reason</span>
          <input className="mt-2 w-full border border-hairline bg-paper px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Reason code</span>
          <input className="mt-2 w-full border border-hairline bg-paper px-3 py-2" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} />
        </label>
      </div>
      <div className="mt-10 space-y-6">
        {offerings.map((offering) => (
          <article key={offering.id} className="border border-hairline bg-white p-6">
            <p className="label">{offering.category}</p>
            <h2 className="font-display text-3xl mt-2">{offering.name}</h2>
            <p className="mt-3 text-sm">
              Status: {offering.status}
              {offering.isIllustrative ? " · Fictional / illustrative" : ""}
            </p>
            <div className="mt-4 flex gap-3 text-sm">
              <button className="border border-hairline px-3 py-2" onClick={(e) => act(offering.id, "approve", e)}>
                Approve
              </button>
              <button className="border border-hairline px-3 py-2" onClick={(e) => act(offering.id, "request-changes", e)}>
                Request changes
              </button>
              <button className="border border-hairline px-3 py-2" onClick={(e) => act(offering.id, "pause", e)}>
                Pause
              </button>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}
