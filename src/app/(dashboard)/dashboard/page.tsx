"use client";

import { useEffect, useState } from "react";
import { Wallet, Activity, TrendingUp, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  wallet: {
    balance: string;
    currency: string;
  } | null;
  usageCount: number;
  totalRatedSpend: string;
  projectsCount: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    wallet: null,
    usageCount: 0,
    totalRatedSpend: "0",
    projectsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const fetchOpts = { cache: "no-store" } as RequestInit;
        const [walletRes, projectsRes, usageRes] = await Promise.all([
          fetch("/api/wallets", fetchOpts),
          fetch("/api/projects", fetchOpts),
          fetch("/api/usage/events", fetchOpts),
        ]);

        const walletData = await walletRes.json();
        const projectsData = await projectsRes.json();
        const usageData = await usageRes.json();

        setData({
          wallet: walletData.wallet,
          projectsCount: projectsData.projects?.length || 0,
          usageCount:
            typeof usageData.total === "number"
              ? usageData.total
              : usageData.events?.length ?? 0,
          totalRatedSpend:
            typeof usageData.totalRatedSpend === "string"
              ? usageData.totalRatedSpend
              : "0",
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const stats: Array<{
    name: string;
    value: string | number;
    subtext?: string;
    icon: typeof Wallet;
    color: string;
    bgColor: string;
  }> = [
    {
      name: "Wallet Balance",
      value: data.wallet?.balance
        ? formatCurrency(parseFloat(data.wallet.balance), data.wallet.currency)
        : "$0.00",
      subtext:
        parseFloat(data.totalRatedSpend) > 0
          ? `${formatCurrency(parseFloat(data.totalRatedSpend), data.wallet?.currency || "USD")} billed from usage (lifetime)`
          : data.usageCount > 0
            ? `${data.usageCount} event(s) recorded; $0 rated — use an ACTIVE plan and matching eventName to debit wallet`
            : "Wallet debits when usage matches an ACTIVE pricing rule (cost > 0)",
      icon: Wallet,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      name: "Active Projects",
      value: data.projectsCount,
      icon: Activity,
      color: "text-cta",
      bgColor: "bg-cta/20",
    },
    {
      name: "Usage Events",
      value: data.usageCount.toLocaleString(),
      subtext: "All time (tenant)",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/20",
    },
    {
      name: "This Month",
      value: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      icon: Clock,
      color: "text-slate-400",
      bgColor: "bg-slate-500/20",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 mt-1">Overview of your billing platform</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-sm text-slate-400">{stat.name}</p>
            <p className={`text-2xl font-semibold mt-1 ${isLoading ? "animate-pulse" : ""}`}>
              {stat.value}
            </p>
            {stat.subtext && (
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{stat.subtext}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/projects"
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-cta" />
                <span>Create New Project</span>
              </div>
              <span className="text-slate-400">→</span>
            </a>
            <a
              href="/wallet"
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-green-400" />
                <span>Add Funds to Wallet</span>
              </div>
              <span className="text-slate-400">→</span>
            </a>
            <a
              href="/usage"
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>View Usage Analytics</span>
              </div>
              <span className="text-slate-400">→</span>
            </a>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium">Create a Project</h3>
                <p className="text-sm text-slate-400">
                  Set up your first project to start tracking usage
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium">Generate API Key</h3>
                <p className="text-sm text-slate-400">
                  Get your SDK credentials from the projects page
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium">Add Funds</h3>
                <p className="text-sm text-slate-400">
                  Credit your wallet to start tracking usage costs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
