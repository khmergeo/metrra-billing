"use client";

import { useEffect, useState } from "react";
import { Receipt, Download, Send } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  subtotal: string;
  tax: string;
  total: string;
  currency: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    amount: string;
  }>;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  async function fetchInvoices() {
    try {
      const url = filter !== "all" ? `/api/invoices?status=${filter}` : "/api/invoices";
      const res = await fetch(url);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error("Fetch invoices error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-slate-500/20 text-slate-400",
    PENDING: "bg-yellow-500/20 text-yellow-400",
    SENT: "bg-blue-500/20 text-blue-400",
    PAID: "bg-green-500/20 text-green-400",
    OVERDUE: "bg-red-500/20 text-red-400",
    CANCELLED: "bg-slate-500/20 text-slate-400",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-slate-400 mt-1">View and manage your invoices</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "DRAFT", "PENDING", "SENT", "PAID", "OVERDUE"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
              filter === status
                ? "bg-primary text-background"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold">Invoice List</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-left text-sm text-slate-400">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Receipt className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold">
                      {formatCurrency(parseFloat(invoice.total), invoice.currency)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.status === "DRAFT" && (
                          <button className="p-2 text-slate-400 hover:text-primary transition-colors cursor-pointer">
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors cursor-pointer">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
