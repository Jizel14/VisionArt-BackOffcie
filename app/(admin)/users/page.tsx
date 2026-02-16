"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Download } from "lucide-react";
import Header from "@/components/layout/Header";
import UsersTable from "@/components/tables/UsersTable";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime } from "@/lib/utils";
import type { User, UserPreferencesData } from "@/types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "15",
        sort: sortKey,
        dir: sortDir,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (provider) params.set("provider", provider);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, provider, sortKey, sortDir]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, provider]);

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const parsePrefs = (u: User): UserPreferencesData | null => {
    if (!u.preferences) return null;
    return typeof u.preferences === "string"
      ? JSON.parse(u.preferences)
      : u.preferences;
  };

  return (
    <>
      <Header title="Utilisateurs" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 p-6"
      >
        {/* Filters bar */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[260px] flex-1">
            <Input
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="w-48">
            <Select
              options={[
                { value: "local", label: "Email (local)" },
                { value: "google", label: "Google" },
              ]}
              placeholder="Tous les fournisseurs"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          </div>
          <Button variant="outline" size="md" icon={<Download className="h-4 w-4" />}>
            Exporter
          </Button>
          <div className="ml-auto text-sm text-slate-500">
            {total} utilisateur{total !== 1 && "s"}
          </div>
        </div>

        {/* Table */}
        <UsersTable
          users={users}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={setSelectedUser}
          loading={loading}
        />

        {/* User detail modal */}
        <Modal
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="Détail utilisateur"
          size="lg"
        >
          {selectedUser && (
            <UserDetail user={selectedUser} prefs={parsePrefs(selectedUser)} />
          )}
        </Modal>
      </motion.div>
    </>
  );
}

/* ---------- user detail inside modal ---------- */

function UserDetail({
  user,
  prefs,
}: {
  user: User;
  prefs: UserPreferencesData | null;
}) {
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center gap-4">
        <Avatar name={user.name} size="lg" />
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {user.name}
          </h3>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <Badge
          variant={user.provider === "google" ? "info" : "default"}
          className="ml-auto"
        >
          {user.provider}
        </Badge>
      </div>

      {/* info grid */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-700">
        <div>
          <p className="text-slate-400">ID</p>
          <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
            {user.id}
          </p>
        </div>
        <div>
          <p className="text-slate-400">Inscrit le</p>
          <p className="text-slate-700 dark:text-slate-300">
            {formatDateTime(user.created_at)}
          </p>
        </div>
        <div>
          <p className="text-slate-400">Fournisseur</p>
          <p className="text-slate-700 dark:text-slate-300">{user.provider}</p>
        </div>
        <div>
          <p className="text-slate-400">Google ID</p>
          <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
            {user.google_id || "—"}
          </p>
        </div>
      </div>

      {/* preferences */}
      {prefs && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Préférences
          </h4>
          <div className="space-y-2 text-sm">
            {prefs.subjects && prefs.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-slate-400 w-24 shrink-0">Sujets:</span>
                {prefs.subjects.map((s) => (
                  <Badge key={s} variant="purple">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {prefs.styles && prefs.styles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-slate-400 w-24 shrink-0">Styles:</span>
                {prefs.styles.map((s) => (
                  <Badge key={s} variant="info">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {prefs.colors && prefs.colors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-slate-400 w-24 shrink-0">Couleurs:</span>
                {prefs.colors.map((c) => (
                  <Badge key={c} variant="success">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
            {prefs.mood && (
              <p>
                <span className="text-slate-400">Ambiance:</span>{" "}
                <span className="text-slate-700 dark:text-slate-300">
                  {prefs.mood}
                </span>
              </p>
            )}
            {prefs.complexity !== undefined && (
              <p>
                <span className="text-slate-400">Complexité:</span>{" "}
                <span className="text-slate-700 dark:text-slate-300">
                  {prefs.complexity}/5
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
