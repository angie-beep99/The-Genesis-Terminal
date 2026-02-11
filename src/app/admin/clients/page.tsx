"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Client } from "@/types/database";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    password: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function loadClients() {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create client");
      }

      setFormData({
        company_name: "",
        contact_name: "",
        contact_email: "",
        password: "",
      });
      setShowForm(false);
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="text-genesis-muted text-sm">Loading clients...</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-genesis-text">Clients</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm"
        >
          {showForm ? "Cancel" : "Add New Client"}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="card mb-6"
        >
          <h2 className="text-sm font-medium text-genesis-text mb-4">
            New Client
          </h2>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Company Name</label>
                <input
                  className="input"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Contact Name</label>
                <input
                  className="input"
                  value={formData.contact_name}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Contact Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="text"
                  className="input"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>
            </div>
            {error && (
              <p className="text-genesis-negative text-sm">{error}</p>
            )}
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Creating..." : "Create Client"}
            </button>
          </form>
        </motion.div>
      )}

      {clients.length === 0 ? (
        <div className="card text-genesis-muted text-sm">
          No clients yet. Add your first client above.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-genesis-border">
                <th className="text-left py-3 px-2 text-genesis-muted font-medium">
                  Company
                </th>
                <th className="text-left py-3 px-2 text-genesis-muted font-medium">
                  Contact
                </th>
                <th className="text-left py-3 px-2 text-genesis-muted font-medium">
                  Email
                </th>
                <th className="text-left py-3 px-2 text-genesis-muted font-medium">
                  Created
                </th>
                <th className="text-right py-3 px-2 text-genesis-muted font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-genesis-border/50 hover:bg-genesis-border/20 transition-colors"
                >
                  <td className="py-3 px-2 text-genesis-text font-medium">
                    {client.company_name}
                  </td>
                  <td className="py-3 px-2 text-genesis-muted">
                    {client.contact_name}
                  </td>
                  <td className="py-3 px-2 text-genesis-muted">
                    {client.contact_email}
                  </td>
                  <td className="py-3 px-2 text-genesis-muted">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-genesis-gold hover:text-genesis-gold/80 text-sm transition-colors"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
