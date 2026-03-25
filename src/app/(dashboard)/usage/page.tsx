"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface UsageEvent {
  id: string;
  eventName: string;
  properties: Record<string, unknown>;
  quantity: string;
  unit: string;
  timestamp: string;
  createdAt: string;
}

export default function UsagePage() {
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  async function fetchUsage() {
    try {
      const res = await fetch("/api/usage/events");
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
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Usage Analytics</h1>
        <p className="text-slate-400 mt-1">Track your usage events and metrics</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
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
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold">Usage Events</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
>
            <p>No usage events recorded yet.</p>
            <p className="text-sm mt-2">Use the SDK to start tracking usage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-left text-sm text-slate-400">
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {events.slice(0, 50).map((event) => (
                  <tr key={event.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-medium">{event.eventName}</td>
                    <td className="px-4 py-4">{parseFloat(event.quantity).toFixed(4)}</td>
                    <td className="px-4 py-4 text-slate-400">{event.unit}</td>
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
        <h2 className="font-semibold mb-4">SDK Integration</h2>
        <p className="text-slate-400 text-sm mb-4">
          To record usage events, integrate the Meterra SDK into your application:
        </p>
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <code className="text-green-400">npm install @meterra/sdk</code>
        </div>
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-3">
          <pre className="text-slate-300">
{`import { meterra } from '@meterra/sdk';

await meterra.recordUsage({
  eventName: 'api_call',
  quantity: 1,
  unit: 'request',
  timestamp: new Date()
});`}
          </pre>
        </div>
      </div>
    </div>
  );
}
