"use client";

import { useEffect, useState } from "react";
import { 
  ScrollText, 
  Search,
  Filter,
  Eye,
  User,
  Building2,
  Settings,
  Key,
  Shield
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  tenantId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  tenantName: string | null;
}

const actionIcons: Record<string, any> = {
  CREATE: User,
  UPDATE: Settings,
  DELETE: Shield,
  LOGIN: Key,
  LOGOUT: Key,
  default: ScrollText,
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [resourceFilter]);

  async function fetchLogs() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        ...(resourceFilter !== "ALL" && { resource: resourceFilter }),
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();

      setLogs(data.logs || []);
    } catch (error) {
      console.error("Fetch logs error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchLogs();
  }

  const getActionIcon = (action: string) => {
    return actionIcons[action] || actionIcons.default;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-slate-400 mt-1">Platform-wide activity tracking</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, resource, or user..."
              className="input-field w-full pl-10"
            />
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="input-field"
        >
          <option value="ALL">All Resources</option>
          <option value="Tenant">Tenants</option>
          <option value="User">Users</option>
          <option value="ApiKey">API Keys</option>
          <option value="Project">Projects</option>
          <option value="Wallet">Wallets</option>
          <option value="Invoice">Invoices</option>
          <option value="PricingPlan">Pricing Plans</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4" colSpan={7}>
                      <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const Icon = getActionIcon(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 text-slate-400 text-sm">
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm">{log.resource}</span>
                        {log.resourceId && (
                          <span className="text-xs text-slate-500 ml-2 font-mono">
                            #{log.resourceId.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {log.userName ? (
                          <div>
                            <p className="text-sm">{log.userName}</p>
                            <p className="text-xs text-slate-500">{log.userEmail}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">System</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-sm">
                        {log.tenantName || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-sm font-mono">
                        {log.ipAddress || "N/A"}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 text-slate-400 hover:text-foreground cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Audit Log Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Action</p>
                  <p className="font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Resource</p>
                  <p className="font-medium">{selectedLog.resource}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Resource ID</p>
                  <p className="font-medium font-mono text-sm">
                    {selectedLog.resourceId || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Timestamp</p>
                  <p className="font-medium text-sm">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">User</p>
                  <p className="font-medium">
                    {selectedLog.userName || "System"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">IP Address</p>
                  <p className="font-medium font-mono text-sm">
                    {selectedLog.ipAddress || "N/A"}
                  </p>
                </div>
              </div>

              {selectedLog.changes && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Changes</p>
                  <pre className="p-3 bg-slate-800/50 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">User Agent</p>
                  <p className="text-sm text-slate-400 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedLog(null)}
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
