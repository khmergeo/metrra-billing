"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Eye,
  X,
  Trash2,
} from "lucide-react";

interface PricingRule {
  id: string;
  eventName: string;
  metric: string;
  pricingType: string;
  unitPrice: string | null;
  flatRate: string | null;
  productId: string | null;
  projectId: string | null;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  rules: PricingRule[];
}

interface Product {
  id: string;
  name: string;
  unit: string;
}

interface Project {
  id: string;
  name: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({
    name: "",
    description: "",
  });
  const [newRuleForm, setNewRuleForm] = useState({
    productId: "",
    projectId: "",
    pricingType: "PER_UNIT",
    unitPrice: "",
    flatRate: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isActivatingPlan, setIsActivatingPlan] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [plansRes, productsRes, projectsRes] = await Promise.all([
        fetch("/api/pricing"),
        fetch("/api/products"),
        fetch("/api/projects"),
      ]);
      const plansData = await plansRes.json();
      const productsData = await productsRes.json();
      const projectsData = await projectsRes.json();
      setPlans(plansData.plans || []);
      setProducts(productsData.products || []);
      setProjects(projectsData.projects || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlanForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create plan");
        return;
      }

      setShowNewPlan(false);
      setNewPlanForm({ name: "", description: "" });
      fetchData();
    } catch (error) {
      setCreateError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleActivatePlan() {
    if (!selectedPlan) return;
    setIsActivatingPlan(true);
    try {
      const res = await fetch(`/api/pricing/${selectedPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (res.ok) {
        await fetchData();
        const updatedRes = await fetch(`/api/pricing`);
        const updatedData = await updatedRes.json();
        const updated = updatedData.plans?.find((p: PricingPlan) => p.id === selectedPlan.id);
        if (updated) setSelectedPlan(updated);
      }
    } catch (error) {
      console.error("Activate plan error:", error);
    } finally {
      setIsActivatingPlan(false);
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;
    
    setIsCreating(true);
    try {
      const selectedProduct = products.find((p) => p.id === newRuleForm.productId);
      
      const res = await fetch(`/api/pricing/${selectedPlan.id}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: selectedProduct?.name || "Custom",
          metric: selectedProduct?.unit || "unit",
          pricingType: newRuleForm.pricingType,
          unitPrice: newRuleForm.pricingType === "PER_UNIT" ? parseFloat(newRuleForm.unitPrice) : undefined,
          flatRate: newRuleForm.pricingType === "FLAT" ? parseFloat(newRuleForm.flatRate) : undefined,
          productId: newRuleForm.productId || undefined,
          projectId: newRuleForm.projectId || undefined,
        }),
      });

      if (res.ok) {
        setShowAddRule(false);
        setNewRuleForm({
          productId: "",
          projectId: "",
          pricingType: "PER_UNIT",
          unitPrice: "",
          flatRate: "",
        });
        fetchData();
        const updatedRes = await fetch(`/api/pricing`);
        const updatedData = await updatedRes.json();
        const updated = updatedData.plans?.find((p: PricingPlan) => p.id === selectedPlan.id);
        if (updated) setSelectedPlan(updated);
      }
    } catch (error) {
      console.error("Add rule error:", error);
    } finally {
      setIsCreating(false);
    }
  }

  const filteredPlans = plans.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Plans</h1>
          <p className="text-slate-400 mt-1">
            Create pricing plans for your products. Only <span className="text-slate-300">ACTIVE</span> plans are
            used when recording usage (<code className="text-xs text-primary">estimatedCost</code>).
          </p>
        </div>
        <button
          onClick={() => setShowNewPlan(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans..."
            className="input-field w-full pl-10"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-4 py-3 font-medium">Plan Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Pricing Rules</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4" colSpan={5}>
                      <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    {search ? "No plans found" : "No plans yet. Create your first pricing plan."}
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-slate-500">{plan.description || "-"}</p>
                        </div>
                      </div>
                    </td>
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
                    <td className="px-4 py-4 text-slate-400">{plan.rules.length}</td>
                    <td className="px-4 py-4 text-slate-400 text-sm">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowAddRule(false);
                        }}
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
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{selectedPlan.name}</h2>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1 text-slate-400 hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{selectedPlan.status}</p>
                    {selectedPlan.status !== "ACTIVE" && (
                      <button
                        type="button"
                        onClick={handleActivatePlan}
                        disabled={isActivatingPlan}
                        className="btn-primary text-xs py-1 px-2"
                      >
                        {isActivatingPlan ? "…" : "Set ACTIVE"}
                      </button>
                    )}
                  </div>
                  {selectedPlan.status !== "ACTIVE" && (
                    <p className="text-xs text-amber-400/90 mt-1">
                      Usage events ignore this plan until it is ACTIVE.
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-400">Pricing Rules</p>
                  <p className="font-medium">{selectedPlan.rules.length}</p>
                </div>
              </div>
              {selectedPlan.description && (
                <div>
                  <p className="text-sm text-slate-400">Description</p>
                  <p className="font-medium">{selectedPlan.description}</p>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Pricing Rules</h3>
                <button
                  onClick={() => setShowAddRule(true)}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Rule
                </button>
              </div>

              {showAddRule ? (
                <form onSubmit={handleAddRule} className="p-4 bg-slate-800/50 rounded-lg space-y-3 mb-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Product</label>
                    <select
                      value={newRuleForm.productId}
                      onChange={(e) => setNewRuleForm((f) => ({ ...f, productId: e.target.value }))}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Project (optional)</label>
                    <select
                      value={newRuleForm.projectId}
                      onChange={(e) => setNewRuleForm((f) => ({ ...f, projectId: e.target.value }))}
                      className="input-field w-full"
                    >
                      <option value="">All projects</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Pricing Type</label>
                    <select
                      value={newRuleForm.pricingType}
                      onChange={(e) => setNewRuleForm((f) => ({ ...f, pricingType: e.target.value }))}
                      className="input-field w-full"
                    >
                      <option value="PER_UNIT">Per Unit</option>
                      <option value="FLAT">Flat Rate</option>
                      <option value="TIERED">Tiered</option>
                    </select>
                  </div>
                  {newRuleForm.pricingType === "PER_UNIT" && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Unit Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newRuleForm.unitPrice}
                        onChange={(e) => setNewRuleForm((f) => ({ ...f, unitPrice: e.target.value }))}
                        className="input-field w-full"
                        placeholder="0.01"
                        required
                      />
                    </div>
                  )}
                  {newRuleForm.pricingType === "FLAT" && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Flat Rate ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newRuleForm.flatRate}
                        onChange={(e) => setNewRuleForm((f) => ({ ...f, flatRate: e.target.value }))}
                        className="input-field w-full"
                        placeholder="99.00"
                        required
                      />
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRule(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary text-sm"
                      disabled={isCreating}
                    >
                      {isCreating ? "Adding..." : "Add Rule"}
                    </button>
                  </div>
                </form>
              ) : null}

              {selectedPlan.rules.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No pricing rules yet. Add rules to define how customers will be charged.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedPlan.rules.map((rule) => (
                    <div key={rule.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{rule.eventName}</span>
                        <span className="text-xs px-2 py-1 bg-slate-700 rounded">
                          {rule.pricingType}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {rule.pricingType === "PER_UNIT" && `$${rule.unitPrice} per ${rule.metric}`}
                        {rule.pricingType === "FLAT" && `$${rule.flatRate} ${rule.metric}`}
                        {rule.pricingType === "TIERED" && "Tiered pricing"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
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

      {showNewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Create Pricing Plan</h2>
              <button
                onClick={() => {
                  setShowNewPlan(false);
                  setCreateError("");
                }}
                className="p-1 text-slate-400 hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={newPlanForm.name}
                  onChange={(e) => setNewPlanForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Starter Plan"
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea
                  value={newPlanForm.description}
                  onChange={(e) => setNewPlanForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Basic plan with essential features..."
                  className="input-field w-full min-h-[80px]"
                />
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
                    setShowNewPlan(false);
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
                  {isCreating ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
