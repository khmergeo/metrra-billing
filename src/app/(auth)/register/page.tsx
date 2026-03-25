"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      adminEmail: formData.get("adminEmail") as string,
      adminName: formData.get("adminName") as string,
      adminPassword: formData.get("adminPassword") as string,
    };

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Registration failed");
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.adminEmail,
          password: data.adminPassword,
          tenantSlug: data.slug,
        }),
      });

      if (!loginRes.ok) {
        throw new Error("Account created. Please login.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-background" />
            </div>
            <span className="font-semibold text-2xl">Meterra</span>
          </Link>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-slate-400 mt-2">Start building usage-based billing</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Company Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Acme Inc"
              className="input-field w-full"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-2">
              Workspace URL
            </label>
            <div className="flex items-center">
              <span className="text-slate-400 text-sm pr-2">meterra.io/</span>
              <input
                type="text"
                id="slug"
                name="slug"
                required
                pattern="[a-z0-9-]+"
                placeholder="acme"
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-medium mb-4">Admin Account</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="adminName" className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="adminName"
                  name="adminName"
                  required
                  placeholder="John Doe"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  required
                  placeholder="john@acme.com"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  name="adminPassword"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="text-center mt-6 text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
