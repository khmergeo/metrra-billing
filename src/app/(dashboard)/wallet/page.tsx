"use client";

import { useEffect, useState } from "react";
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface WalletData {
  id: string;
  balance: string;
  currency: string;
  alertThreshold: string | null;
  transactions: Array<{
    id: string;
    type: string;
    amount: string;
    balanceBefore: string;
    balanceAfter: string;
    reference: string | null;
    createdAt: string;
  }>;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCredit, setShowCredit] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    fetchWallet();
  }, []);

  async function fetchWallet() {
    try {
      const res = await fetch("/api/wallets", { cache: "no-store" });
      const data = await res.json();
      setWallet(data.wallet);
    } catch (error) {
      console.error("Fetch wallet error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCredit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "credit",
          amount: parseFloat(amount),
          reference: "Manual credit",
        }),
      });

      if (res.ok) {
        setShowCredit(false);
        setAmount("");
        fetchWallet();
      }
    } catch (error) {
      console.error("Credit error:", error);
    }
  }

  const balance = wallet?.balance ? parseFloat(wallet.balance) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-slate-400 mt-1">Manage your funds and transactions</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Balance</h2>
            <button
              onClick={() => setShowCredit(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Funds
            </button>
          </div>

          {showCredit && (
            <form onSubmit={handleCredit} className="mb-6 p-4 bg-slate-900/50 rounded-lg">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field w-full"
                    placeholder="100.00"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" className="btn-primary">
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCredit(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${isLoading ? "animate-pulse" : ""}`}>
              {wallet?.currency || "USD"} {formatCurrency(balance, wallet?.currency || "USD").replace("$", "")}
            </span>
          </div>

          {wallet?.alertThreshold && (
            <p className="text-sm text-slate-400 mt-2">
              Alert threshold: {formatCurrency(parseFloat(wallet.alertThreshold))}
            </p>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Currency</span>
              <span>{wallet?.currency || "USD"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Transactions</span>
              <span>{wallet?.transactions?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold">Recent Transactions</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : !wallet?.transactions?.length ? (
          <div className="p-8 text-center text-slate-400">
            No transactions yet. Add funds to get started.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {wallet.transactions.map((tx) => {
              const isCredit = tx.type === "CREDIT";
              return (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isCredit ? "bg-green-500/20" : "bg-red-500/20"
                    }`}>
                      {isCredit ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{tx.type.toLowerCase()}</p>
                      <p className="text-sm text-slate-400">
                        {tx.reference || "No reference"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isCredit ? "text-green-400" : "text-red-400"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(parseFloat(tx.amount))}
                    </p>
                    <p className="text-sm text-slate-400">
                      {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
