"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Eye,
  Mail,
  Phone,
  CreditCard,
  MoreHorizontal,
  X,
  RefreshCw,
  Calendar,
  CheckCircle,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  billingType: string;
  status: string;
  externalCustomerId: string | null;
  createdAt: string;
  wallet: { balance: string; currency: string } | null;
  subscriptions: Subscription[];
  invoices: Invoice[];
  _count: {
    subscriptions: number;
    invoices: number;
    usageEvents: number;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string;
  dueDate: string;
}

interface Subscription {
  id: string;
  billingCycle: string;
  status: string;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetailTab, setCustomerDetailTab] = useState<"info" | "subscriptions" | "invoices">("info");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    billingType: "POSTPAID",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showNewSubscription, setShowNewSubscription] = useState(false);
  const [newSubscriptionForm, setNewSubscriptionForm] = useState({
    pricingPlanId: "",
    billingCycle: "MONTHLY",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, statusFilter]);

  async function fetchCustomers() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(search && { search }),
      });

      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();

      setCustomers(data.customers || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Fetch customers error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchCustomers();
  }

  async function viewCustomer(customerId: string) {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      const data = await res.json();
      if (data.customer) {
        setSelectedCustomer(data.customer);
        setCustomerDetailTab("info");
      }
    } catch (error) {
      console.error("Fetch customer error:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomerForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create customer");
        return;
      }

      setShowNewCustomer(false);
      setNewCustomerForm({
        name: "",
        email: "",
        phone: "",
        billingType: "POSTPAID",
      });
      fetchCustomers();
    } catch (error) {
      setCreateError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  }

  async function fetchPricingPlans() {
    try {
      const res = await fetch("/api/pricing");
      const data = await res.json();
      setPricingPlans(data.plans || []);
    } catch (error) {
      console.error("Fetch plans error:", error);
    }
  }

  function openNewSubscription() {
    setSubscriptionError("");
    fetchPricingPlans();
    setShowNewSubscription(true);
  }

  async function handleCreateSubscription(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    setIsCreatingSubscription(true);
    setSubscriptionError("");
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          pricingPlanId: newSubscriptionForm.pricingPlanId,
          billingCycle: newSubscriptionForm.billingCycle,
          startDate: newSubscriptionForm.startDate,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setShowNewSubscription(false);
        setNewSubscriptionForm({
          pricingPlanId: "",
          billingCycle: "MONTHLY",
          startDate: new Date().toISOString().split("T")[0],
        });
        setCustomerDetailTab("subscriptions");
        await viewCustomer(selectedCustomer.id);
        fetchCustomers();
      } else {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.details?.[0]?.message
              ? `Validation: ${data.details[0].message}`
              : "Failed to create subscription";
        setSubscriptionError(msg);
      }
    } catch (error) {
      console.error("Create subscription error:", error);
      setSubscriptionError("An unexpected error occurred");
    } finally {
      setIsCreatingSubscription(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-slate-400 mt-1">Manage your end customers</p>
        </div>
        <button
          onClick={() => setShowNewCustomer(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="input-field w-full pl-10"
            />
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="input-field"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="CHURNED">Churned</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Billing Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Subscriptions</th>
                <th className="px-4 py-3 font-medium">Invoices</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4" colSpan={7}>
                      <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-slate-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                        {customer.billingType}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        customer.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : customer.status === "SUSPENDED"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{customer._count.subscriptions}</td>
                    <td className="px-4 py-4 text-slate-400">{customer._count.invoices}</td>
                    <td className="px-4 py-4 text-slate-400 text-sm">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => viewCustomer(customer.id)}
                        className="p-1 text-slate-400 hover:text-foreground cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} customers
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn-secondary text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Customer Details</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-slate-400 hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
              <button
                onClick={() => setCustomerDetailTab("info")}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  customerDetailTab === "info"
                    ? "bg-primary/20 text-primary"
                    : "text-slate-400 hover:text-foreground"
                }`}
              >
                Info
              </button>
              <button
                onClick={() => setCustomerDetailTab("subscriptions")}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  customerDetailTab === "subscriptions"
                    ? "bg-primary/20 text-primary"
                    : "text-slate-400 hover:text-foreground"
                }`}
              >
                Subscriptions ({selectedCustomer._count?.subscriptions || 0})
              </button>
              <button
                onClick={() => setCustomerDetailTab("invoices")}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  customerDetailTab === "invoices"
                    ? "bg-primary/20 text-primary"
                    : "text-slate-400 hover:text-foreground"
                }`}
              >
                Invoices ({selectedCustomer._count?.invoices || 0})
              </button>
            </div>

            {customerDetailTab === "info" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Name</p>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Phone</p>
                    <p className="font-medium">{selectedCustomer.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Billing Type</p>
                    <p className="font-medium">{selectedCustomer.billingType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    <p className="font-medium">{selectedCustomer.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">External ID</p>
                    <p className="font-medium">{selectedCustomer.externalCustomerId || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Wallet Balance</p>
                    <p className="font-medium">
                      ${selectedCustomer.wallet?.balance || "0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Created</p>
                    <p className="font-medium">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {customerDetailTab === "subscriptions" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={openNewSubscription}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Subscription
                  </button>
                </div>
                {isLoadingDetail ? (
                  <div className="text-center py-8 text-slate-400">Loading...</div>
                ) : selectedCustomer.subscriptions && selectedCustomer.subscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.subscriptions.map((sub) => (
                      <div key={sub.id} className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-blue-400" />
                            <span className="font-medium">Subscription</span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            sub.status === "ACTIVE"
                              ? "bg-green-500/20 text-green-400"
                              : sub.status === "PAUSED"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-slate-400">Billing: </span>
                            <span>{sub.billingCycle}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Period: </span>
                            <span>
                              {new Date(sub.currentPeriodStart).toLocaleDateString()} - {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No subscriptions yet. Click "Add Subscription" to create one.
                  </div>
                )}
              </div>
            )}

            {customerDetailTab === "invoices" && (
              <div className="space-y-4">
                {isLoadingDetail ? (
                  <div className="text-center py-8 text-slate-400">Loading...</div>
                ) : selectedCustomer.invoices && selectedCustomer.invoices.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.invoices.map((invoice: any) => (
                      <div key={invoice.id} className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-purple-400" />
                            <span className="font-medium">{invoice.invoiceNumber}</span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            invoice.status === "PAID"
                              ? "bg-green-500/20 text-green-400"
                              : invoice.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-slate-400">Amount: </span>
                            <span>${invoice.total}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Due: </span>
                            <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No invoices yet
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Customer</h2>
              <button
                onClick={() => {
                  setShowNewCustomer(false);
                  setCreateError("");
                }}
                className="p-1 text-slate-400 hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Billing Type</label>
                <select
                  value={newCustomerForm.billingType}
                  onChange={(e) => setNewCustomerForm((f) => ({ ...f, billingType: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="POSTPAID">Postpaid</option>
                  <option value="PREPAID">Prepaid</option>
                </select>
              </div>
              {createError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {createError}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCustomer(false);
                    setCreateError("");
                  }}
                  className="btn-secondary"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewSubscription && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Subscription</h2>
              <button
                onClick={() => {
                  setShowNewSubscription(false);
                  setSubscriptionError("");
                }}
                className="p-1 text-slate-400 hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubscription} className="space-y-4">
              {subscriptionError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {subscriptionError}
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Pricing Plan</label>
                <select
                  value={newSubscriptionForm.pricingPlanId}
                  onChange={(e) => setNewSubscriptionForm((f) => ({ ...f, pricingPlanId: e.target.value }))}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select a plan</option>
                  {pricingPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Billing Cycle</label>
                <select
                  value={newSubscriptionForm.billingCycle}
                  onChange={(e) => setNewSubscriptionForm((f) => ({ ...f, billingCycle: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="PAY_AS_YOU_GO">Pay as you go</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newSubscriptionForm.startDate}
                  onChange={(e) => setNewSubscriptionForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="input-field w-full"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSubscription(false);
                    setSubscriptionError("");
                  }}
                  className="btn-secondary"
                  disabled={isCreatingSubscription}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isCreatingSubscription || !newSubscriptionForm.pricingPlanId}
                >
                  {isCreatingSubscription ? "Creating..." : "Create Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
