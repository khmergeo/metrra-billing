"use client";

import { useEffect, useState } from "react";
import { Plus, Key, MoreHorizontal, Trash2, Eye, Copy, Check } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  status: string;
  lastUsedAt: string | null;
  createdAt: string;
  key?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleteConfirmKeyId, setDeleteConfirmKeyId] = useState<string | null>(null);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  function deleteApiKey(keyId: string) {
    setDeleteConfirmKeyId(keyId);
  }

  function confirmDelete() {
    if (!deleteConfirmKeyId) return;
    fetch(`/api/api-keys?id=${deleteConfirmKeyId}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) {
          fetchData();
        }
      })
      .catch((error) => {
        console.error("Delete API key error:", error);
      })
      .finally(() => {
        setDeleteConfirmKeyId(null);
      });
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [projectsRes, keysRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/api-keys"),
      ]);

      const projectsData = await projectsRes.json();
      const keysData = await keysRes.json();

      setProjects(projectsData.projects || []);
      setApiKeys(keysData.apiKeys || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
        }),
      });

      if (res.ok) {
        setShowNewProject(false);
        fetchData();
      }
    } catch (error) {
      console.error("Create project error:", error);
    }
  }

  async function createApiKey(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          projectId: formData.get("projectId") || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewKey(data.apiKey.key);
        setNewKeyName("");
        setShowNewKey(false);
        fetchData();
      }
    } catch (error) {
      console.error("Create API key error:", error);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-slate-400 mt-1">Manage your projects and API keys</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {showNewProject && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Create Project</h2>
          <form onSubmit={createProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                name="name"
                required
                className="input-field w-full"
                placeholder="My Awesome Project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                rows={3}
                className="input-field w-full resize-none"
                placeholder="Project description..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewProject(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {newKey && (
        <div className="glass-card p-6 border-green-500/50">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-green-400 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-green-400">API Key Created</h2>
              <p className="text-sm text-slate-400 mt-1">
                Copy this key now. You won&apos;t be able to see it again.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 p-3 bg-slate-900 rounded-lg font-mono text-sm break-all">
                  {newKey}
                </div>
                <button
                  onClick={() => copyToClipboard(newKey)}
                  className="btn-secondary flex items-center gap-2 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={() => setNewKey(null)}
                className="btn-secondary mt-4"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold">Your Projects</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No projects yet. Create your first project to get started.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {projects.map((project) => (
              <div key={project.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div>
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-sm text-slate-400">{project.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  project.status === "ACTIVE"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-slate-500/20 text-slate-400"
                }`}>
                  {project.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold">API Keys</h2>
          <button
            onClick={() => setShowNewKey(true)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Key
          </button>
        </div>

        {showNewKey && (
          <div className="p-4 border-b border-white/10 bg-slate-900/50">
            <form onSubmit={createApiKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Key Name</label>
                <input
                  type="text"
                  name="name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  required
                  className="input-field w-full"
                  placeholder="Production API Key"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  Generate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewKey(false);
                    setNewKeyName("");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No API keys yet. Generate a key to use the SDK.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div>
                  <h3 className="font-medium">{key.name}</h3>
                  <p className="text-sm text-slate-400 font-mono">{key.keyPrefix}...</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    key.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {key.status}
                  </span>
                  <button
                    onClick={() => deleteApiKey(key.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete API Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteConfirmKeyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">Delete API Key?</h2>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete this API key? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmKeyId(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
