"use client";

import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types/user";

interface RecentUsersTableProps {
  users: User[];
}

export default function RecentUsersTable({ users }: RecentUsersTableProps) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Derniers inscrits
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">
                Utilisateur
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">
                Email
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">
                Oeuvres
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">
                Inscrit le
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-slate-50 transition-colors hover:bg-slate-50/50 dark:border-slate-800/30 dark:hover:bg-slate-800/30"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {u.name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                  {u.email}
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                  {u.public_generations_count}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {formatDate(u.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
