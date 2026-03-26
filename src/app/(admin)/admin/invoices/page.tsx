"use client";

import { useEffect, useState } from "react";
import { 
  Receipt, 
  Search,
  Eye,
  Download,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: string;
  tax: string;
  total: string;
  currency: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  async function fetchInvoices() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/invoices?${params}`);
      const data = await res.json();

      setInvoices(data.invoices || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error("Fetch invoices error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchInvoices();
  }

  const filteredInvoices = invoices.filter(i => 
    i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    i.tenantName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-slate-400 mt-1">Platform-wide invoice management</p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Receipt className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">Total Invoices</span>
          </div>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm text-slate-400">Pending</span>
          </div>
          <p className="text-2xl font-semibold">{stats.pending}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-slate-400">Paid</span>
          </div>
          <p className="text-2xl font-semibold">{stats.paid}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-slate-400">Overdue</span>
          </div>
          <p className="text-2xl font-semibold">{stats.overdue}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="input-field w-full pl-10"
            />
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr className="text-left text-sm text-slate-400">
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">Tenant</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Due Date</th>
              <th className="px-4 py-3 font-medium">Actions</th>
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
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium font-mono">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm">{invoice.tenantName}</p>
                    <p className="text-xs text-slate-500">{invoice.tenantSlug}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold">${parseFloat(invoice.total).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">
                      Tax: ${parseFloat(invoice.tax).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      invoice.status === "PAID"
                        ? "bg-green-500/20 text-green-400"
                        : invoice.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : invoice.status === "OVERDUE"
                        ? "bg-red-500/20 text-red-400"
                        : invoice.status === "SENT"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-slate-500/20 text-slate-400"
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-400 text-sm">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-1 text-slate-400 hover:text-foreground cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-slate-400 hover:text-foreground cursor-pointer">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Invoice Number</p>
                  <p className="font-medium font-mono">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="font-medium">{selectedInvoice.status}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Tenant</p>
                  <p className="font-medium">{selectedInvoice.tenantName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Due Date</p>
                  <p className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span>${parseFloat(selectedInvoice.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax</span>
                    <span>${parseFloat(selectedInvoice.tax).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t border-white/10 pt-2">
                    <span>Total</span>
                    <span className="text-primary">${parseFloat(selectedInvoice.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
