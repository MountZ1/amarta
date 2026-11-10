"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import {
  Plus,
  Users,
  Edit,
  Trash2,
  X,
  Mail,
  Lock,
  User,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) {
        setUsersList(data.users);
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setModalError("");
    setIsModalOpen(true);
  };

  const openEditModal = (u: AdminUser) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword("");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!name.trim() || !email.trim()) {
      setModalError("Nama dan email wajib diisi");
      return;
    }

    if (!editingUser && (!password || password.length < 6)) {
      setModalError("Password minimal 6 karakter");
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
      };
      if (password) {
        payload.password = password;
      }

      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan user admin");
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message || "Terjadi kesalahan saat menyimpan user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, userName: string) => {
    if (!confirm(`Yakin ingin menghapus akun admin "${userName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus admin");
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Manajemen Pengguna Admin
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kelola akun administrator toko kopi. Buyer/pelanggan tidak perlu login.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-900 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Admin Baru</span>
        </button>
      </div>

      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Memuat daftar pengguna admin...
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="mx-auto h-8 w-8 opacity-40 mb-2" />
            <p className="text-sm font-semibold">Tidak ada pengguna admin</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Dibuat Pada</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Admin</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-base">
                {editingUser ? "Edit Akun Admin" : "Tambah Admin Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Nama Admin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="admin@kopi.test"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Password {editingUser ? "(Kosongkan jika tidak diubah)" : "*"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder={editingUser ? "••••••••" : "Minimal 6 karakter"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-amber-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-900 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
