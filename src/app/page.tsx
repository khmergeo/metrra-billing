import Link from "next/link";
import { ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-4 left-4 right-4 z-50">
        <nav className="glass-card px-6 py-3 flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <span className="font-semibold text-lg">Meterra</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="nav-link">
              Login
            </Link>
            <Link href="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-slate-400 bg-clip-text text-transparent">
              Usage-Based Billing
              <br />
              Made Simple
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Build metered billing, usage tracking, and wallet systems into your SaaS.
              Scale from startup to enterprise with multi-tenant architecture.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-lg px-6 py-3">
                Start Building <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="btn-secondary inline-flex items-center gap-2 text-lg px-6 py-3">
                View Demo
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Usage Tracking</h3>
              <p className="text-slate-400">
                Real-time event ingestion with idempotency. SDK support for Node.js and more platforms.
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="w-12 h-12 bg-cta/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-cta" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Pricing</h3>
              <p className="text-slate-400">
                Support for flat rates, per-unit, tiered, and volume-based pricing models.
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-slate-400">
                Multi-tenant isolation, RBAC, audit logs, and API key management out of the box.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500">© 2024 Meterra. Built for developers.</p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/login">Client Portal</Link>
            <Link href="/admin/login">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
