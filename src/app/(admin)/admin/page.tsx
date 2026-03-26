"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  Users, 
  Activity, 
  DollarSign, 
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalUsageEvents: number;
  totalRevenue: number;
  pendingInvoices: number;
  recentActivity: number;
  failedOperations: number;
}

interface RecentTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  userCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalUsageEvents: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    recentActivity: 0,
    failedOperations: 0,
  });
  const [recentTenants, setRecentTenants] = useState<RecentTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        
        setStats(data.stats || stats);
        setRecentTenants(data.recentTenants || []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const statCards = [
    {
      name: "Total Tenants",
      value: stats.totalTenants,
      icon: Building2,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      change: "+12%",
      changeUp: true,
    },
    {
      name: "Active Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      change: "+8%",
      changeUp: true,
    },
    {
      name: "Usage Events",
      value: stats.totalUsageEvents.toLocaleString(),
      icon: Activity,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      change: "+23%",
      changeUp: true,
    },
    {
      name: "Platform Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      change: "+15%",
      changeUp: true,
    },
    {
      name: "Pending Invoices",
      value: stats.pendingInvoices,
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      change: "-5%",
      changeUp: true,
    },
    {
      name: "System Alerts",
      value: stats.failedOperations,
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      change: stats.failedOperations > 10 ? "+High" : "Normal",
      changeUp: false,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-slate-400 mt-1">Overview of the Meterra billing platform</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                stat.changeUp ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-slate-400">{stat.name}</p>
            <p className={`text-2xl font-semibold mt-1 ${isLoading ? "animate-pulse" : ""}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Tenants</h2>
            <a href="/admin/tenants" className="text-sm text-primary hover:underline">
              View all →
            </a>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentTenants.length === 0 ? (
            <p className="text-slate-400 text-sm">No tenants yet</p>
          ) : (
            <div className="space-y-3">
              {recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-slate-500">{tenant.slug}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tenant.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-400"
                        : tenant.status === "SUSPENDED"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {tenant.status}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{tenant.userCount} users</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Platform Health</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm">API Response Time</span>
              </div>
              <span className="text-sm text-green-400">45ms avg</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm">Database Connections</span>
              </div>
              <span className="text-sm text-green-400">12 active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm">Uptime</span>
              </div>
              <span className="text-sm text-green-400">99.9%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-green-400" />
                <span className="text-sm">Requests Today</span>
              </div>
              <span className="text-sm text-green-400">{(125420).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
