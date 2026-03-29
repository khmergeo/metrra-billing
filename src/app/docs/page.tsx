"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">API reference</h1>
          <p className="text-sm text-slate-500">
            OpenAPI 3 ·{" "}
            <a
              href="/openapi.yaml"
              className="text-primary hover:underline"
              download
            >
              Download openapi.yaml
            </a>
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
          ← Dashboard
        </Link>
      </header>
      <div className="swagger-wrap">
        <SwaggerUI url="/openapi.yaml" docExpansion="list" defaultModelsExpandDepth={2} />
      </div>
    </div>
  );
}
