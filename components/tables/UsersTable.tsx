"use client";

import DataTable, { type Column } from "@/components/ui/DataTable";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import type { User } from "@/types/user";

interface UsersTableProps {
  users: User[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  onRowClick: (user: User) => void;
  loading: boolean;
}

export default function UsersTable({
  users,
  page,
  totalPages,
  onPageChange,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  loading,
}: UsersTableProps) {
  const columns: Column<User>[] = [
    {
      key: "name",
      label: "Utilisateur",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {row.name}
            </p>
            <p className="text-xs text-slate-400">{row.id.slice(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "public_generations_count",
      label: "Oeuvres",
      sortable: true,
      render: (row) => (
        <span className="text-slate-600 dark:text-slate-400">
          {row.public_generations_count}
        </span>
      ),
    },
    {
      key: "is_admin",
      label: "Rôle",
      render: (row) => (
        <Badge variant={row.is_admin ? "purple" : "default"}>
          {row.is_admin ? "Admin" : "Utilisateur"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Inscrit le",
      sortable: true,
      render: (row) => (
        <span className="text-slate-500">{formatDateTime(row.created_at)}</span>
      ),
    },
  ];

  return (
    <DataTable<User>
      columns={columns}
      data={users}
      keyField="id"
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      onRowClick={onRowClick}
      loading={loading}
      emptyMessage="Aucun utilisateur trouvé"
    />
  );
}
