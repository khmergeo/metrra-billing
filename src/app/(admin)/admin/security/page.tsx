"use client";

import { useEffect, useState } from "react";
import { 
  Shield, 
  Plus,
  Edit,
  Trash2,
  Users,
  Key,
  CheckCircle,
  AlertTriangle,
  Lock
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  permissions: any;
  userCount: number;
  createdAt: string;
}

interface ApiKeyStats {
  total: number;
  active: number;
  revoked: number;
  expired: number;
}

export default function AdminSecurityPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [apiKeyStats, setApiKeyStats] = useState<ApiKeyStats>({
    total: 0,
    active: 0,
    revoked: 0,
    expired: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSecurity();
  }, []);

  async function fetchSecurity() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/security");
      const data = await res.json();

      setRoles(data.roles || []);
      setApiKeyStats(data.apiKeyStats || apiKeyStats);
    } catch (error) {
      console.error("Fetch security error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const defaultRoles = [
    { name: "OWNER", description: "Full access to all resources", color: "purple" },
    { name: "ADMIN", description: "Administrative access", color: "blue" },
    { name: "MEMBER", description: "Standard member access", color: "green" },
    { name: "VIEWER", description: "Read-only access", color: "gray" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Security & RBAC</h1>
        <p className="text-slate-400 mt-1">Manage roles, permissions, and API keys</p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-slate-400">Total Roles</span>
          </div>
          <p className="text-2xl font-semibold">{roles.length}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Key className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-slate-400">Active API Keys</span>
          </div>
          <p className="text-2xl font-semibold">{apiKeyStats.active}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-slate-400">Revoked Keys</span>
          </div>
          <p className="text-2xl font-semibold">{apiKeyStats.revoked}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Lock className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm text-slate-400">Expired Keys</span>
          </div>
          <p className="text-2xl font-semibold">{apiKeyStats.expired}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold">Role Definitions</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr className="text-left text-sm text-slate-400">
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Users</th>
              <th className="px-4 py-3 font-medium">Permissions</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-4" colSpan={5}>
                    <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : (
              defaultRoles.map((role) => {
                const dbRole = roles.find(r => r.name === role.name);
                return (
                  <tr key={role.name} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          role.color === "purple" ? "bg-purple-500/20" :
                          role.color === "blue" ? "bg-blue-500/20" :
                          role.color === "green" ? "bg-green-500/20" :
                          "bg-slate-500/20"
                        }`}>
                          <Shield className={`w-5 h-5 ${
                            role.color === "purple" ? "text-purple-400" :
                            role.color === "blue" ? "text-blue-400" :
                            role.color === "green" ? "text-green-400" :
                            "text-slate-400"
                          }`} />
                        </div>
                        <span className="font-semibold">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{role.description}</td>
                    <td className="px-4 py-4 text-slate-400">
                      {dbRole?.userCount || 0}
                    </td>
                    <td className="px-4 py-4">
                      {dbRole?.permissions ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(dbRole.permissions).slice(0, 3).map(([resource, actions]: [string, any]) => (
                            <span key={resource} className="px-2 py-0.5 bg-slate-700 rounded text-xs">
                              {resource}: {actions.length}
                            </span>
                          ))}
                          {Object.keys(dbRole.permissions).length > 3 && (
                            <span className="px-2 py-0.5 bg-slate-700 rounded text-xs">
                              +{Object.keys(dbRole.permissions).length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">Default permissions</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-slate-400 hover:text-foreground cursor-pointer">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Permission Reference</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { resource: "Tenants", permissions: ["create", "read", "update", "delete"] },
            { resource: "Users", permissions: ["create", "read", "update", "delete", "suspend"] },
            { resource: "Projects", permissions: ["create", "read", "update", "delete"] },
            { resource: "API Keys", permissions: ["create", "read", "revoke"] },
            { resource: "Wallets", permissions: ["read", "credit", "debit"] },
            { resource: "Usage Events", permissions: ["create", "read"] },
            { resource: "Pricing Plans", permissions: ["create", "read", "update", "delete"] },
            { resource: "Invoices", permissions: ["create", "read", "update", "send", "cancel"] },
            { resource: "Audit Logs", permissions: ["read"] },
            { resource: "Settings", permissions: ["read", "update"] },
          ].map((perm) => (
            <div key={perm.resource} className="p-4 bg-slate-800/50 rounded-lg">
              <p className="font-medium mb-2">{perm.resource}</p>
              <div className="flex flex-wrap gap-1">
                {perm.permissions.map((action) => (
                  <span key={action} className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                    {action}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Security Best Practices</h2>
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="font-medium text-green-400">API Key Rotation</p>
              <p className="text-sm text-slate-400 mt-1">
                Regularly rotate API keys and revoke unused ones to maintain security.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="font-medium text-green-400">Principle of Least Privilege</p>
              <p className="text-sm text-slate-400 mt-1">
                Assign users only the permissions they need for their role.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <p className="font-medium text-yellow-400">Audit Trail</p>
              <p className="text-sm text-slate-400 mt-1">
                All actions are logged. Review audit logs regularly for suspicious activity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
