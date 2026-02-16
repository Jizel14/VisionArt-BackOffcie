"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Palette,
  Bug,
  UserX,
  Flag,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime } from "@/lib/utils";
import type { Report, ReportStatus } from "@/types/report";

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; variant: "info" | "danger" | "warning" | "purple" }
> = {
  artwork: {
    label: "Oeuvre",
    icon: <Palette className="h-3.5 w-3.5" />,
    variant: "purple",
  },
  bug: {
    label: "Bug",
    icon: <Bug className="h-3.5 w-3.5" />,
    variant: "danger",
  },
  user: {
    label: "Utilisateur",
    icon: <UserX className="h-3.5 w-3.5" />,
    variant: "warning",
  },
  other: {
    label: "Autre",
    icon: <Flag className="h-3.5 w-3.5" />,
    variant: "info",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; variant: "default" | "warning" | "success" | "danger" }
> = {
  pending: {
    label: "En attente",
    icon: <Clock className="h-3.5 w-3.5" />,
    variant: "warning",
  },
  reviewing: {
    label: "En cours",
    icon: <Eye className="h-3.5 w-3.5" />,
    variant: "default",
  },
  resolved: {
    label: "Résolu",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    variant: "success",
  },
  dismissed: {
    label: "Rejeté",
    icon: <XCircle className="h-3.5 w-3.5" />,
    variant: "danger",
  },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);
  const [updating, setUpdating] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "15",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      setReports(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, statusFilter]);

  const handleStatusUpdate = async (id: string, status: ReportStatus, adminNote?: string) => {
    setUpdating(true);
    try {
      await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });
      await fetchReports();
      setSelected(null);
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const columns: Column<Report>[] = [
    {
      key: "type",
      label: "Type",
      render: (row) => {
        const cfg = TYPE_CONFIG[row.type] || TYPE_CONFIG.other;
        return (
          <Badge variant={cfg.variant} className="gap-1">
            {cfg.icon} {cfg.label}
          </Badge>
        );
      },
    },
    {
      key: "subject",
      label: "Sujet",
      className: "max-w-[200px]",
      render: (row) => (
        <span className="truncate block font-medium text-slate-800 dark:text-slate-200">
          {row.subject}
        </span>
      ),
    },
    {
      key: "user",
      label: "Rapporteur",
      render: (row) =>
        row.user ? (
          <div className="flex items-center gap-2">
            <Avatar name={row.user.name} size="sm" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {row.user.name}
              </p>
              <p className="text-xs text-slate-400">{row.user.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "status",
      label: "Statut",
      render: (row) => {
        const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.pending;
        return (
          <Badge variant={cfg.variant} className="gap-1">
            {cfg.icon} {cfg.label}
          </Badge>
        );
      },
    },
    {
      key: "targetId",
      label: "Cible",
      render: (row) =>
        row.targetId ? (
          <span className="font-mono text-xs text-slate-500">
            {row.targetId.slice(0, 12)}...
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => (
        <span className="text-slate-500 text-xs">{formatDateTime(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <>
      <Header title="Signalements" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 p-6"
      >
        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["pending", "reviewing", "resolved", "dismissed"] as const).map(
            (s) => {
              const count = reports.filter((r) => r.status === s).length;
              const cfg = STATUS_CONFIG[s];
              return (
                <Card key={s} hover>
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400">{cfg.icon}</div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {count}
                      </p>
                      <p className="text-xs text-slate-500">{cfg.label}</p>
                    </div>
                  </div>
                </Card>
              );
            }
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[260px] flex-1">
            <Input
              placeholder="Rechercher sujet, description, utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="w-44">
            <Select
              options={[
                { value: "artwork", label: "Oeuvre" },
                { value: "bug", label: "Bug" },
                { value: "user", label: "Utilisateur" },
                { value: "other", label: "Autre" },
              ]}
              placeholder="Tous les types"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Select
              options={[
                { value: "pending", label: "En attente" },
                { value: "reviewing", label: "En cours" },
                { value: "resolved", label: "Résolu" },
                { value: "dismissed", label: "Rejeté" },
              ]}
              placeholder="Tous les statuts"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <span className="text-sm text-slate-500">
            {total} signalement{total !== 1 && "s"}
          </span>
        </div>

        {/* Table */}
        <DataTable<Report>
          columns={columns}
          data={reports}
          keyField="id"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={setSelected}
          loading={loading}
          emptyMessage="Aucun signalement"
        />

        {/* Detail modal */}
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title="Détail du signalement"
          size="lg"
        >
          {selected && (
            <ReportDetail
              report={selected}
              onUpdateStatus={handleStatusUpdate}
              updating={updating}
            />
          )}
        </Modal>
      </motion.div>
    </>
  );
}

/* ---- Report detail inside modal ---- */

function ReportDetail({
  report,
  onUpdateStatus,
  updating,
}: {
  report: Report;
  onUpdateStatus: (id: string, status: ReportStatus, note?: string) => void;
  updating: boolean;
}) {
  const [note, setNote] = useState(report.adminNote || "");
  const typeCfg = TYPE_CONFIG[report.type] || TYPE_CONFIG.other;
  const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {report.user && <Avatar name={report.user.name} size="md" />}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              {report.user?.name || "Utilisateur inconnu"}
            </p>
            <p className="text-sm text-slate-500">{report.user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={typeCfg.variant} className="gap-1">
            {typeCfg.icon} {typeCfg.label}
          </Badge>
          <Badge variant={statusCfg.variant} className="gap-1">
            {statusCfg.icon} {statusCfg.label}
          </Badge>
        </div>
      </div>

      {/* content */}
      <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">
          {report.subject}
        </h4>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
          {report.description}
        </p>
      </div>

      {/* image */}
      {report.imageUrl && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-500">Capture d&apos;écran:</p>
          <a
            href={report.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Voir l&apos;image
          </a>
        </div>
      )}

      {/* meta */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-400">ID</p>
          <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
            {report.id}
          </p>
        </div>
        <div>
          <p className="text-slate-400">Date</p>
          <p className="text-slate-700 dark:text-slate-300">
            {formatDateTime(report.createdAt)}
          </p>
        </div>
        {report.targetId && (
          <div>
            <p className="text-slate-400">Cible ID</p>
            <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
              {report.targetId}
            </p>
          </div>
        )}
      </div>

      {/* admin note */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Note admin
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Ajouter une note..."
        />
      </div>

      {/* action buttons */}
      <div className="flex flex-wrap gap-2">
        {report.status !== "reviewing" && (
          <Button
            variant="secondary"
            size="sm"
            loading={updating}
            icon={<Eye className="h-4 w-4" />}
            onClick={() => onUpdateStatus(report.id, "reviewing", note)}
          >
            Marquer en cours
          </Button>
        )}
        {report.status !== "resolved" && (
          <Button
            variant="primary"
            size="sm"
            loading={updating}
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={() => onUpdateStatus(report.id, "resolved", note)}
          >
            Résoudre
          </Button>
        )}
        {report.status !== "dismissed" && (
          <Button
            variant="danger"
            size="sm"
            loading={updating}
            icon={<XCircle className="h-4 w-4" />}
            onClick={() => onUpdateStatus(report.id, "dismissed", note)}
          >
            Rejeter
          </Button>
        )}
      </div>
    </div>
  );
}
