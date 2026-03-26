"use client";

import { useEffect, useState } from "react";
import { 
  Activity, 
  TrendingUp,
  Clock,
  BarChart3,
  Zap
} from "lucide-react";

interface UsageStats {
  totalEvents: number;
  eventsToday: number;
  eventsThisMonth: number;
  avgEventsPerDay: number;
}

interface EventDistribution {
  eventName: string;
  count: number;
  percentage: number;
}

interface UsageTrend {
  date: string;
  count: number;
}

interface TenantUsage {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  eventCount: number;
  totalQuantity: string;
}

export default function AdminUsagePage() {
  const [stats, setStats] = useState<UsageStats>({
    totalEvents: 0,
    eventsToday: 0,
    eventsThisMonth: 0,
    avgEventsPerDay: 0,
  });
  const [eventDistribution, setEventDistribution] = useState<EventDistribution[]>([]);
  const [usageTrend, setUsageTrend] = useState<UsageTrend[]>([]);
  const [tenantUsage, setTenantUsage] = useState<TenantUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetchUsage();
  }, [timeRange]);

  async function fetchUsage() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/usage?range=${timeRange}`);
      const data = await res.json();

      setStats(data.stats || stats);
      setEventDistribution(data.eventDistribution || []);
      setUsageTrend(data.usageTrend || []);
      setTenantUsage(data.tenantUsage || []);
    } catch (error) {
      console.error("Fetch usage error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const maxTrendValue = Math.max(...usageTrend.map(t => t.count), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Usage</h1>
          <p className="text-slate-400 mt-1">Platform-wide usage analytics</p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? "bg-primary text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">Total Events</span>
          </div>
          <p className="text-2xl font-semibold">{stats.totalEvents.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-slate-400">Events Today</span>
          </div>
          <p className="text-2xl font-semibold">{stats.eventsToday.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-slate-400">This Month</span>
          </div>
          <p className="text-2xl font-semibold">{stats.eventsThisMonth.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm text-slate-400">Avg/Day</span>
          </div>
          <p className="text-2xl font-semibold">{stats.avgEventsPerDay.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Usage Trend</h2>
          {isLoading ? (
            <div className="h-40 flex items-end gap-2">
              {[...Array(14)].map((_, i) => (
                <div key={i} className="flex-1 bg-slate-700/50 rounded-t animate-pulse" style={{ height: `${Math.random() * 100}%` }} />
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-end gap-2">
              {usageTrend.map((day, i) => (
                <div key={i} className="flex-1 group relative">
                  <div
                    className="bg-gradient-to-t from-primary to-secondary rounded-t transition-all hover:opacity-80"
                    style={{ height: `${(day.count / maxTrendValue) * 100}%` }}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.date}: {day.count.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Event Distribution</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-6 bg-slate-800/50 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {eventDistribution.slice(0, 8).map((event, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{event.eventName}</span>
                    <span className="text-sm text-slate-400">
                      {event.count.toLocaleString()} ({event.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                      style={{ width: `${event.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold">Usage by Tenant</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr className="text-left text-sm text-slate-400">
              <th className="px-4 py-3 font-medium">Tenant</th>
              <th className="px-4 py-3 font-medium">Event Count</th>
              <th className="px-4 py-3 font-medium">Total Quantity</th>
              <th className="px-4 py-3 font-medium">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-4" colSpan={4}>
                    <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : tenantUsage.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No usage data found
                </td>
              </tr>
            ) : (
              tenantUsage.map((tenant) => (
                <tr key={tenant.tenantId} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-medium">{tenant.tenantName}</p>
                    <p className="text-sm text-slate-500">{tenant.tenantSlug}</p>
                  </td>
                  <td className="px-4 py-4">{tenant.eventCount.toLocaleString()}</td>
                  <td className="px-4 py-4">{parseFloat(tenant.totalQuantity).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(tenant.eventCount / stats.totalEvents) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400">
                        {((tenant.eventCount / stats.totalEvents) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
