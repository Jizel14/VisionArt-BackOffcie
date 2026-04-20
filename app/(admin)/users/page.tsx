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
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime } from "@/lib/utils";
import type { User } from "@/types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState("");
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
      if (isAdmin) params.set("isAdmin", isAdmin);

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
  }, [page, debouncedSearch, isAdmin, sortKey, sortDir]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, isAdmin]);

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
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
                { value: "true", label: "Admins uniquement" },
                { value: "false", label: "Non-admins" },
              ]}
              placeholder="Tous les utilisateurs"
              value={isAdmin}
              onChange={(e) => setIsAdmin(e.target.value)}
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
          {selectedUser && <UserDetail user={selectedUser} />}
        </Modal>
      </motion.div>
    </>
  );
}

function UserDetail({ user }: { user: User }) {
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
        <div className="ml-auto flex gap-2">
          {user.is_admin && <Badge variant="info">Admin</Badge>}
          {user.is_verified && <Badge variant="success">Vérifié</Badge>}
          {user.is_private_account && <Badge variant="default">Privé</Badge>}
        </div>
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
          <p className="text-slate-400">Téléphone</p>
          <p className="text-slate-700 dark:text-slate-300">
            {user.phone_number || "—"}
          </p>
        </div>
        <div>
          <p className="text-slate-400">Site web</p>
          <p className="text-slate-700 dark:text-slate-300 truncate">
            {user.website ? (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                {user.website}
              </a>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div>
          <p className="text-slate-400">Abonnés / Abonnements</p>
          <p className="text-slate-700 dark:text-slate-300">
            {user.followers_count} / {user.following_count}
          </p>
        </div>
        <div>
          <p className="text-slate-400">Générations publiques</p>
          <p className="text-slate-700 dark:text-slate-300">
            {user.public_generations_count}
          </p>
        </div>
      </div>

      {/* bio */}
      {user.bio && (
        <div>
          <h4 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Bio
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.bio}</p>
        </div>
      )}
    </div>
  );
}
