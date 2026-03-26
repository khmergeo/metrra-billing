"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Percent,
  Layers
} from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  status: string;
  tenantId: string;
  tenantName: string;
  ruleCount: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
}

interface PricingRule {
  id: string;
  eventName: string;
  metric: string;
  pricingType: string;
  flatRate: string | null;
  unitPrice: string | null;
  planId: string;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [activeTab, setActiveTab] = useState<"plans" | "rules">("plans");

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/plans");
      const data = await res.json();

      setPlans(data.plans || []);
      setRules(data.rules || []);
    } catch (error) {
      console.error("Fetch plans error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPlans = plans.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tenantName.toLowerCase().includes(search.toLowerCase())
  );

  const planRules = selectedPlan 
    ? rules.filter(r => r.planId === selectedPlan.id)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Plans & Rating</h1>
        <p className="text-slate-400 mt-1">Manage pricing plans and rating rules</p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">Total Plans</span>
          </div>
          <p className="text-2xl font-semibold">{plans.length}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/20">
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-slate-400">Active Plans</span>
          </div>
          <p className="text-2xl font-semibold">
            {plans.filter(p => p.status === "ACTIVE").length}
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-slate-400">Pricing Rules</span>
          </div>
          <p className="text-2xl font-semibold">{rules.length}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Percent className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm text-slate-400">Tiered Plans</span>
          </div>
          <p className="text-2xl font-semibold">
            {rules.filter(r => r.pricingType === "TIERED").length}
          </p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab("plans")}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${
            activeTab === "plans"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          Pricing Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${
            activeTab === "rules"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          Pricing Rules ({rules.length})
        </button>
      </div>

      {activeTab === "plans" && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plans..."
              className="input-field w-full pl-10"
            />
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-left text-sm text-slate-400">
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Rules</th>
                  <th className="px-4 py-3 font-medium">Effective</th>
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
                ) : filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No plans found
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-slate-500">{plan.description || "No description"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-400">{plan.tenantName}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          plan.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400"
                            : plan.status === "DRAFT"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-slate-500/20 text-slate-400"
                        }`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-400">{plan.ruleCount}</td>
                      <td className="px-4 py-4 text-slate-400 text-sm">
                        {plan.effectiveFrom
                          ? `${new Date(plan.effectiveFrom).toLocaleDateString()} - ${plan.effectiveTo ? new Date(plan.effectiveTo).toLocaleDateString() : "Ongoing"}`
                          : "Not set"}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setSelectedPlan(plan)}
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
        </>
      )}

      {activeTab === "rules" && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium">Pricing Type</th>
                <th className="px-4 py-3 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4" colSpan={4}>
                      <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No pricing rules found
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-medium">{rule.eventName}</td>
                    <td className="px-4 py-4 text-slate-400">{rule.metric}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rule.pricingType === "FLAT"
                          ? "bg-blue-500/20 text-blue-400"
                          : rule.pricingType === "PER_UNIT"
                          ? "bg-green-500/20 text-green-400"
                          : rule.pricingType === "TIERED"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {rule.pricingType}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {rule.flatRate ? `$${rule.flatRate}` : rule.unitPrice ? `$${rule.unitPrice}/unit` : "See tiers"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Plan Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Name</p>
                  <p className="font-medium">{selectedPlan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Tenant</p>
                  <p className="font-medium">{selectedPlan.tenantName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="font-medium">{selectedPlan.status}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Rules</p>
                  <p className="font-medium">{selectedPlan.ruleCount}</p>
                </div>
              </div>
              
              {planRules.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-400 mb-2">Pricing Rules</p>
                  <div className="space-y-2">
                    {planRules.map((rule) => (
                      <div key={rule.id} className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="font-medium">{rule.eventName}</p>
                        <p className="text-sm text-slate-400">
                          {rule.pricingType} - {rule.metric}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedPlan(null)}
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
