"use client";

import { useEffect, useState } from "react";
import { Activity, BarChart3 } from "lucide-react";

interface TrialBalanceEntry {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

export default function LedgerPage() {
  const [trialBalance, setTrialBalance] = useState<TrialBalanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  async function fetchLedger() {
    try {
      const res = await fetch("/api/ledgers");
      const data = await res.json();
      setTrialBalance(data.trialBalance || []);
    } catch (error) {
      console.error("Fetch ledger error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const totals = trialBalance.reduce(
    (acc, entry) => ({
      debit: acc.debit + entry.debit,
      credit: acc.credit + entry.credit,
    }),
    { debit: 0, credit: 0 }
  );

  const typeColors: Record<string, string> = {
    ASSET: "text-blue-400",
    LIABILITY: "text-red-400",
    EQUITY: "text-purple-400",
    REVENUE: "text-green-400",
    EXPENSE: "text-yellow-400",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">General Ledger</h1>
        <p className="text-slate-400 mt-1">Double-entry accounting with trial balance</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-slate-400">Total Accounts</span>
          </div>
          <p className="text-2xl font-bold">{trialBalance.length}</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            <span className="text-slate-400">Total Debits</span>
          </div>
          <p className="text-2xl font-bold">${totals.debit.toFixed(2)}</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-red-400" />
            <span className="text-slate-400">Total Credits</span>
          </div>
          <p className="text-2xl font-bold">${totals.credit.toFixed(2)}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold">Trial Balance</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : trialBalance.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No ledger entries yet. Usage events will create ledger entries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-left text-sm text-slate-400">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">Debit</th>
                  <th className="px-4 py-3 font-medium text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {trialBalance.map((entry) => (
                  <tr key={entry.code} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-mono">{entry.code}</td>
                    <td className="px-4 py-4 font-medium">{entry.name}</td>
                    <td className="px-4 py-4">
                      <span className={`text-sm ${typeColors[entry.type]}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900/50 border-t border-white/10">
                <tr>
                  <td colSpan={3} className="px-4 py-3 font-semibold">Totals</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-400">
                    ${totals.debit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-400">
                    ${totals.credit.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold mb-4">Double-Entry Accounting Rules</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-slate-900/50 rounded-lg">
            <h3 className="font-medium text-blue-400 mb-2">Debit Entries</h3>
            <ul className="space-y-1 text-slate-400">
              <li>• Increase: Assets, Expenses</li>
              <li>• Decrease: Liabilities, Equity, Revenue</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-lg">
            <h3 className="font-medium text-red-400 mb-2">Credit Entries</h3>
            <ul className="space-y-1 text-slate-400">
              <li>• Increase: Liabilities, Equity, Revenue</li>
              <li>• Decrease: Assets, Expenses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
