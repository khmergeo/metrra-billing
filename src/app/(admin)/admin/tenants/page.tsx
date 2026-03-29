"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  Plus, 
  Search, 
  MoreHorizontal,
  UserPlus,
  Ban,
  CheckCircle,
  Trash2,
  Eye
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  userCount: number;
  projectCount: number;
  walletBalance: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CreateTenantForm {
  name: string;
  slug: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showNewTenant, setShowNewTenant] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [createForm, setCreateForm] = useState<CreateTenantForm>({
    name: "",
    slug: "",
    adminEmail: "",
    adminName: "",
    adminPassword: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetchTenants();
  }, [pagination.page, statusFilter]);

  async function fetchTenants() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/tenants?${params}`);
      const data = await res.json();

      setTenants(data.tenants || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Fetch tenants error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateTenantStatus(tenantId: string, status: string) {
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchTenants();
      }
    } catch (error) {
      console.error("Update tenant error:", error);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchTenants();
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  function handleNameChange(name: string) {
    setCreateForm(f => ({ ...f, name, slug: generateSlug(name) }));
  }

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create tenant");
        return;
      }

      setShowNewTenant(false);
      setCreateForm({
        name: "",
        slug: "",
        adminEmail: "",
        adminName: "",
        adminPassword: "",
      });
      fetchTenants();
    } catch (error) {
      setCreateError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenants Management</h1>
          <p className="text-slate-400 mt-1">Manage all platform tenants</p>
        </div>
        <button
          onClick={() => setShowNewTenant(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Tenant
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
              placeholder="Search tenants..."
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
            setPagination(p => ({ ...p, page: 1 }));
          }}
          className="input-field"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DELETED">Deleted</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Users</th>
                <th className="px-4 py-3 font-medium">Projects</th>
                <th className="px-4 py-3 font-medium">Balance</th>
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
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No tenants found
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-sm text-slate-500">{tenant.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        tenant.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : tenant.status === "SUSPENDED"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{tenant.userCount}</td>
                    <td className="px-4 py-4 text-slate-400">{tenant.projectCount}</td>
                    <td className="px-4 py-4 text-slate-400">${tenant.walletBalance}</td>
                    <td className="px-4 py-4 text-slate-400 text-sm">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTenant(tenant)}
                          className="p-1 text-slate-400 hover:text-foreground cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {tenant.status === "ACTIVE" ? (
                          <button
                            onClick={() => updateTenantStatus(tenant.id, "SUSPENDED")}
                            className="p-1 text-slate-400 hover:text-yellow-400 cursor-pointer"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : tenant.status === "SUSPENDED" ? (
                          <button
                            onClick={() => updateTenantStatus(tenant.id, "ACTIVE")}
                            className="p-1 text-slate-400 hover:text-green-400 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
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
              {pagination.total} tenants
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn-secondary text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Tenant Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Name</p>
                  <p className="font-medium">{selectedTenant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Slug</p>
                  <p className="font-medium">{selectedTenant.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="font-medium">{selectedTenant.status}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Balance</p>
                  <p className="font-medium">${selectedTenant.walletBalance}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Users</p>
                  <p className="font-medium">{selectedTenant.userCount}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Projects</p>
                  <p className="font-medium">{selectedTenant.projectCount}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedTenant(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Create New Tenant</h2>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tenant Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Acme Corporation"
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Slug</label>
                <input
                  type="text"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="acme-corp"
                  pattern="^[a-z0-9-]+$"
                  className="input-field w-full"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Lowercase letters, numbers, and hyphens only</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-sm font-medium text-slate-300 mb-3">Admin User</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Admin Name</label>
                    <input
                      type="text"
                      value={createForm.adminName}
                      onChange={(e) => setCreateForm(f => ({ ...f, adminName: e.target.value }))}
                      placeholder="John Doe"
                      className="input-field w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Admin Email</label>
                    <input
                      type="email"
                      value={createForm.adminEmail}
                      onChange={(e) => setCreateForm(f => ({ ...f, adminEmail: e.target.value }))}
                      placeholder="admin@acme.com"
                      className="input-field w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Admin Password</label>
                    <input
                      type="password"
                      value={createForm.adminPassword}
                      onChange={(e) => setCreateForm(f => ({ ...f, adminPassword: e.target.value }))}
                      placeholder="Min. 8 characters"
                      minLength={8}
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>
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
                    setShowNewTenant(false);
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
                  {isCreating ? "Creating..." : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
