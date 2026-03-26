"use client";

import { useEffect, useState } from "react";
import { 
  Wallet, 
  Search, 
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Building2
} from "lucide-react";

interface WalletData {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  balance: string;
  currency: string;
  alertThreshold: string | null;
  createdAt: string;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: string;
    createdAt: string;
  }>;
}

interface LedgerEntry {
  id: string;
  tenantId: string;
  projectId: string;
  accountId: string;
  entryType: string;
  amount: string;
  description: string | null;
  reference: string;
  createdAt: string;
  tenant: { name: string; slug: string };
  project: { name: string };
  account: { name: string; code: string };
}

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wallets" | "ledger">("wallets");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    totalBalance: 0,
    avgBalance: 0,
    totalCredits: 0,
    totalDebits: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/wallets");
      const data = await res.json();

      setWallets(data.wallets || []);
      setLedgerEntries(data.ledgerEntries || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredWallets = wallets.filter(w => 
    w.tenantName.toLowerCase().includes(search.toLowerCase()) ||
    w.tenantSlug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Wallets & Ledger</h1>
        <p className="text-slate-400 mt-1">Platform-wide wallet and ledger management</p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-slate-400">Total Platform Balance</span>
          </div>
          <p className="text-2xl font-semibold">${stats.totalBalance.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">Total Credits</span>
          </div>
          <p className="text-2xl font-semibold text-green-400">+${stats.totalCredits.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/20">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-slate-400">Total Debits</span>
          </div>
          <p className="text-2xl font-semibold text-red-400">-${stats.totalDebits.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-slate-400">Avg Wallet Balance</span>
          </div>
          <p className="text-2xl font-semibold">${stats.avgBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab("wallets")}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${
            activeTab === "wallets"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          Wallets ({wallets.length})
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${
            activeTab === "ledger"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          Ledger Entries ({ledgerEntries.length})
        </button>
      </div>

      {activeTab === "wallets" && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wallets..."
              className="input-field w-full pl-10"
            />
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-left text-sm text-slate-400">
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Currency</th>
                  <th className="px-4 py-3 font-medium">Alert Threshold</th>
                  <th className="px-4 py-3 font-medium">Recent Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4" colSpan={5}>
                        <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredWallets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No wallets found
                    </td>
                  </tr>
                ) : (
                  filteredWallets.map((wallet) => (
                    <tr key={wallet.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium">{wallet.tenantName}</p>
                            <p className="text-sm text-slate-500">{wallet.tenantSlug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-semibold ${
                          parseFloat(wallet.balance) >= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          ${parseFloat(wallet.balance).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-400">{wallet.currency}</td>
                      <td className="px-4 py-4 text-slate-400">
                        {wallet.alertThreshold ? `$${wallet.alertThreshold}` : "Not set"}
                      </td>
                      <td className="px-4 py-4">
                        {wallet.recentTransactions.length > 0 ? (
                          <div className="flex gap-2">
                            {wallet.recentTransactions.slice(0, 3).map((tx) => (
                              <span
                                key={tx.id}
                                className={`px-2 py-1 text-xs rounded ${
                                  tx.type === "CREDIT"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {tx.type}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">No activity</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "ledger" && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4" colSpan={6}>
                      <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No ledger entries found
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 text-slate-400 text-sm">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm">{entry.tenant.name}</p>
                      <p className="text-xs text-slate-500">{entry.tenant.slug}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm">{entry.account.name}</p>
                      <p className="text-xs text-slate-500">{entry.account.code}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        entry.entryType === "DEBIT"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }`}>
                        {entry.entryType}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono">
                      ${parseFloat(entry.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-sm">{entry.reference}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
