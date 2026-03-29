"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface UsageEvent {
  id: string;
  projectName?: string;
  eventName: string;
  properties: Record<string, unknown>;
  quantity: string;
  unit: string;
  timestamp: string;
  createdAt: string;
  ratedCost?: string | null;
}

export default function UsagePage() {
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  async function fetchUsage() {
    try {
      const res = await fetch("/api/usage/events", { cache: "no-store" });
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Fetch usage error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const stats = {
    totalEvents: events.length,
    totalQuantity: events.reduce((sum, e) => sum + parseFloat(e.quantity), 0),
    uniqueEvents: new Set(events.map((e) => e.eventName)).size,
    totalCost: events.reduce(
      (sum, e) => sum + (e.ratedCost != null ? parseFloat(e.ratedCost) : 0),
      0
    ),
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Usage Analytics</h1>
        <p className="text-slate-400 mt-1">
          Events ingested via API key are listed here. When a rule matches, cost is stored and your tenant wallet is
          debited in the same step.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-slate-400">Total Events</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalEvents}</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-slate-400">Total Usage</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalQuantity.toFixed(2)}</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-cta" />
            <span className="text-slate-400">Unique Event Types</span>
          </div>
          <p className="text-2xl font-bold">{stats.uniqueEvents}</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-slate-400">Wallet debits (sum)</span>
          </div>
          <p className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
          <h2 className="font-semibold">Usage Events</h2>
          <button type="button" onClick={() => fetchUsage()} className="btn-secondary text-sm">
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No usage events recorded yet.</p>
            <p className="text-sm mt-2">Use the SDK to start tracking usage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-left text-sm text-slate-400">
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Cost</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {events.slice(0, 50).map((event) => (
                  <tr key={event.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 text-slate-300">{event.projectName ?? "—"}</td>
                    <td className="px-4 py-4 font-medium">{event.eventName}</td>
                    <td className="px-4 py-4">{parseFloat(event.quantity).toFixed(4)}</td>
                    <td className="px-4 py-4 text-slate-400">{event.unit}</td>
                    <td className="px-4 py-4 text-slate-300">
                      {event.ratedCost != null ? `$${parseFloat(event.ratedCost).toFixed(6)}` : "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {formatDateTime(event.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold mb-4">SDK integration</h2>
        <p className="text-slate-400 text-sm mb-4">
          Use the SDK with a project-scoped API key, or pass <code className="text-slate-300">projectId</code> when
          the key is tenant-wide. Optional <code className="text-slate-300">productId</code> aligns with
          product-scoped pricing rules.
        </p>
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <code className="text-green-400">npm install @meterra/sdk</code>
        </div>
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-3">
          <pre className="text-slate-300">
{`import { meterra } from '@meterra/sdk';

meterra.init({
  apiKey: process.env.METERRA_API_KEY!,
  baseUrl: 'https://your-app.example.com', // origin that serves /api/usage/events
});

const { eventId, estimatedCost, pricingRuleId } = await meterra.recordUsage({
  eventName: 'api_call',
  quantity: 1,
  unit: 'request',
  timestamp: new Date(),
  // projectId: '…', // required if the API key is not scoped to a project
  // productId: '…', // optional, for product-scoped pricing rules
});`}
          </pre>
        </div>
        <p className="text-slate-500 text-xs mt-3">
          Response includes <code className="text-slate-400">estimatedCost</code> and{" "}
          <code className="text-slate-400">pricingRuleId</code>. If cost is greater than zero, the tenant wallet is
          debited in the same request; <strong className="text-slate-400">402</strong> means insufficient balance (no
          event stored).
        </p>
      </div>
    </div>
  );
}
