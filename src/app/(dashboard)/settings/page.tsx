"use client";

import { useEffect, useState } from "react";
import { User, Shield, Key, Bell, Trash2 } from "lucide-react";

interface SettingsProps {
  params: { section?: string };
}

export default function SettingsPage({ params }: SettingsProps) {
  const [activeTab, setActiveTab] = useState(params?.section || "profile");

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "security", name: "Security", icon: Shield },
    { id: "api-keys", name: "API Keys", icon: Key },
    { id: "notifications", name: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account settings</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "bg-primary text-background"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6">Profile Settings</h2>
          <form className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input type="text" className="input-field w-full" defaultValue="Admin User" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" className="input-field w-full" defaultValue="admin@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <input type="text" className="input-field w-full" value="Owner" disabled />
            </div>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </form>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-6">Change Password</h2>
            <form className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input type="password" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input type="password" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input type="password" className="input-field w-full" />
              </div>
              <button type="submit" className="btn-primary">
                Update Password
              </button>
            </form>
          </div>

          <div className="glass-card p-6 border-red-500/30">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-slate-400 text-sm mb-4">
              Permanently delete your account and all associated data.
            </p>
            <button className="btn-secondary flex items-center gap-2 text-red-400 hover:bg-red-500/20">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      )}

      {activeTab === "api-keys" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6">API Key Management</h2>
          <p className="text-slate-400 mb-4">
            Manage your API keys from the Projects page.
          </p>
          <a href="/projects" className="btn-primary inline-flex">
            Go to Projects
          </a>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>
          <div className="space-y-4 max-w-md">
            <label className="flex items-center justify-between cursor-pointer">
              <span>Email notifications for usage alerts</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Low balance warnings</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Invoice generated notifications</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
            </label>
            <button className="btn-primary mt-4">Save Preferences</button>
          </div>
        </div>
      )}
    </div>
  );
}
