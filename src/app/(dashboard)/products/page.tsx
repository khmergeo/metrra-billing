"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Eye,
  X,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  status: string;
  createdAt: string;
  _count: {
    pricingRules: number;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    description: "",
    unit: "unit",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Fetch products error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProductForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create product");
        return;
      }

      setShowNewProduct(false);
      setNewProductForm({
        name: "",
        description: "",
        unit: "unit",
      });
      fetchProducts();
    } catch (error) {
      setCreateError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products & Services</h1>
          <p className="text-slate-400 mt-1">Define what you sell to customers</p>
        </div>
        <button
          onClick={() => setShowNewProduct(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input-field w-full pl-10"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Unit</th>
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
                    <td className="px-4 py-4" colSpan={6}>
                      <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    {search ? "No products found" : "No products yet. Add your first product to get started."}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-slate-500">{product.description || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{product.unit}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{product._count.pricingRules}</td>
                    <td className="px-4 py-4 text-slate-400 text-sm">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedProduct(product)}
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

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Product Details</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-slate-400 hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Name</p>
                  <p className="font-medium">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Unit</p>
                  <p className="font-medium">{selectedProduct.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="font-medium">{selectedProduct.status}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Pricing Rules</p>
                  <p className="font-medium">{selectedProduct._count.pricingRules}</p>
                </div>
              </div>
              {selectedProduct.description && (
                <div>
                  <p className="text-sm text-slate-400">Description</p>
                  <p className="font-medium">{selectedProduct.description}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedProduct(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Product</h2>
              <button
                onClick={() => {
                  setShowNewProduct(false);
                  setCreateError("");
                }}
                className="p-1 text-slate-400 hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Product Name</label>
                <input
                  type="text"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="eKYC Verification"
                  className="input-field w-full"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">e.g., "SMS", "API Calls", "Storage GB"</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Description of what this product does..."
                  className="input-field w-full min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Unit</label>
                <input
                  type="text"
                  value={newProductForm.unit}
                  onChange={(e) => setNewProductForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="unit"
                  className="input-field w-full"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">e.g., "verification", "message", "GB"</p>
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
                    setShowNewProduct(false);
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
                  {isCreating ? "Creating..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
