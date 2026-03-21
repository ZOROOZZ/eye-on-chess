"use client";

import { useEffect, useState, useCallback } from "react";
import { adminRequest } from "../../../lib/adminApi";
import { useToast } from "../../../components/Toast";
import ConfirmModal from "../../../components/ConfirmModal";
import { Skeleton } from "../../../components/Skeleton";

interface User {
  id: string;
  email: string;
  username: string;
  rating: number;
  role: string;
  active: boolean;
  verified: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{
    type: "delete" | "toggle";
    user: User;
    field?: string;
    value?: unknown;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const data = await adminRequest("get", `/api/admin/users?${params}`);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      toast.show("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  async function updateUser(id: string, data: Record<string, unknown>) {
    setActionLoading(true);
    try {
      await adminRequest("patch", `/api/admin/users/${id}`, data);
      toast.show("User updated");
      await loadUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Update failed";
      toast.show(msg, "error");
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  }

  async function deleteUser(id: string) {
    setActionLoading(true);
    try {
      await adminRequest("delete", `/api/admin/users/${id}`);
      toast.show("User deleted");
      await loadUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Delete failed";
      toast.show(msg, "error");
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by username or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-3 py-2 bg-gray-800 border border-gray-700 rounded mb-4 focus:outline-none focus:border-blue-500"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Rating</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Verified</th>
                  <th className="px-3 py-2">Joined</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                    <td className="px-3 py-2 font-medium">{u.username}</td>
                    <td className="px-3 py-2 text-gray-400">{u.email}</td>
                    <td className="px-3 py-2">{u.rating}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          u.role === "ADMIN"
                            ? "bg-purple-600/20 text-purple-400"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          u.active ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                        }`}
                      >
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {u.verified ? (
                        <span className="text-green-400 text-xs">Yes</span>
                      ) : (
                        <span className="text-gray-500 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            setConfirm({
                              type: "toggle",
                              user: u,
                              field: "active",
                              value: !u.active,
                            })
                          }
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        >
                          {u.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => updateUser(u.id, { verified: !u.verified })}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        >
                          {u.verified ? "Unverify" : "Verify"}
                        </button>
                        <button
                          onClick={() =>
                            setConfirm({
                              type: "toggle",
                              user: u,
                              field: "role",
                              value: u.role === "ADMIN" ? "USER" : "ADMIN",
                            })
                          }
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        >
                          {u.role === "ADMIN" ? "Demote" : "Promote"}
                        </button>
                        <button
                          onClick={() => setConfirm({ type: "delete", user: u })}
                          className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{u.username}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        u.role === "ADMIN"
                          ? "bg-purple-600/20 text-purple-400"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {u.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        u.active ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                      }`}
                    >
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    onClick={() =>
                      setConfirm({
                        type: "toggle",
                        user: u,
                        field: "active",
                        value: !u.active,
                      })
                    }
                    className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    {u.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => updateUser(u.id, { verified: !u.verified })}
                    className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    {u.verified ? "Unverify" : "Verify"}
                  </button>
                  <button
                    onClick={() =>
                      setConfirm({
                        type: "toggle",
                        user: u,
                        field: "role",
                        value: u.role === "ADMIN" ? "USER" : "ADMIN",
                      })
                    }
                    className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    {u.role === "ADMIN" ? "Demote" : "Promote"}
                  </button>
                  <button
                    onClick={() => setConfirm({ type: "delete", user: u })}
                    className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-sm"
              >
                Prev
              </button>
              <span className="text-sm text-gray-400">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirm modal */}
      <ConfirmModal
        open={!!confirm}
        title={
          confirm?.type === "delete"
            ? `Delete ${confirm.user.username}?`
            : `${confirm?.field === "role" ? (confirm.value === "ADMIN" ? "Promote" : "Demote") : confirm?.value ? "Activate" : "Deactivate"} ${confirm?.user.username}?`
        }
        message={
          confirm?.type === "delete"
            ? "This will permanently delete this user and all their data. This cannot be undone."
            : `Are you sure you want to ${confirm?.field === "role" ? (confirm?.value === "ADMIN" ? "promote to admin" : "demote to user") : confirm?.value ? "activate" : "deactivate"} this user?`
        }
        confirmLabel={confirm?.type === "delete" ? "Delete" : "Confirm"}
        confirmVariant={confirm?.type === "delete" ? "danger" : "primary"}
        loading={actionLoading}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.type === "delete") {
            deleteUser(confirm.user.id);
          } else {
            updateUser(confirm.user.id, {
              [confirm.field!]: confirm.value,
            });
          }
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
