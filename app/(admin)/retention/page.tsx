"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/auth/api-client";
import { formatNumber } from "@/lib/utils";

type Kpis = {
  actionsLast7d: number;
  actionsLast30d: number;
  pendingReview: number;
  openRate30d: number;
  clickRate30d: number;
  conversionRate30d: number;
  revenueSavedEur30d: number;
  segmentsLast7d: { segment: string; count: number }[];
  timeseries: { date: string; count: number }[];
};

type PendingItem = {
  id: string;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  segment: string;
  channel: string;
  payload: { subject: string; body: string; cta_label: string; preheader?: string };
  context: Record<string, unknown>;
  promoCode?: string | null;
  createdAt: string;
  requiresReview: boolean;
};

type HistoryItem = {
  id: string;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  segment: string;
  channel: string;
  status: string;
  payload: { subject: string; body: string; cta_label: string; preheader?: string };
  promoCode?: string | null;
  requiresReview: boolean;
  sentAt?: string | null;
  createdAt: string;
  opens: number;
  clicks: number;
  conversions: number;
};

function pct(v: number) {
  const x = Math.max(0, Math.min(1, v));
  return `${Math.round(x * 100)}%`;
}

function money(v: number) {
  return `${v.toFixed(2)} €`;
}

function SegmentBadge({ seg }: { seg: string }) {
  const variant =
    seg.includes("LAPSED") || seg.includes("WIN_BACK") || seg === "LOST"
      ? "danger"
      : seg.includes("PRO") || seg.includes("PAYMENT")
        ? "warning"
        : "success";
  return <Badge variant={variant}>{seg}</Badge>;
}

export default function RetentionPage() {
  const [tab, setTab] = useState<"overview" | "pending" | "history">("overview");
  const [lastError, setLastError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historySegment, setHistorySegment] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCta, setEditCta] = useState("");

  const maxTs = useMemo(() => {
    if (!kpis?.timeseries?.length) return 0;
    return Math.max(...kpis.timeseries.map((t) => t.count));
  }, [kpis]);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/retention/kpis");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`KPI error ${res.status}: ${txt}`);
      }
      const data = (await res.json()) as Kpis;
      setKpis(data);
    } finally {
      setLoading(false);
    }
  };

  const refreshPending = async () => {
    setPendingLoading(true);
    try {
      const res = await apiFetch("/api/admin/retention/pending?limit=100");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Pending error ${res.status}: ${txt}`);
      }
      const data = (await res.json()) as { items: PendingItem[] };
      setPending(data.items || []);
    } finally {
      setPendingLoading(false);
    }
  };

  const refreshHistory = async (opts?: { page?: number }) => {
    const page = opts?.page ?? historyPage;
    setHistoryLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("pageSize", "30");
      if (historySegment.trim()) qs.set("segment", historySegment.trim());
      if (historyStatus.trim()) qs.set("status", historyStatus.trim());
      const res = await apiFetch(`/api/admin/retention/history?${qs.toString()}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`History error ${res.status}: ${txt}`);
      }
      const data = (await res.json()) as {
        items: HistoryItem[];
        totalPages: number;
      };
      setHistory(data.items || []);
      setHistoryTotalPages(Math.max(1, Number(data.totalPages || 1)));
      setHistoryPage(page);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    refreshAll().catch(() => {});
    refreshPending().catch(() => {});
    refreshHistory({ page: 1 }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (id: string) => {
    setActionBusy(id);
    try {
      setLastError(null);
      const res = await apiFetch(`/api/admin/retention/actions/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Approve error ${res.status}: ${txt}`);
      }
      await refreshPending();
      await refreshAll();
    } catch (e) {
      setLastError((e as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const reject = async (id: string) => {
    const reason = prompt("Raison (optionnel) ?") || "";
    setActionBusy(id);
    try {
      setLastError(null);
      const res = await apiFetch(`/api/admin/retention/actions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Reject error ${res.status}: ${txt}`);
      }
      await refreshPending();
      await refreshAll();
    } catch (e) {
      setLastError((e as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const openEdit = (item: PendingItem) => {
    setEditId(item.id);
    setEditSubject(item.payload.subject || "");
    setEditBody(item.payload.body || "");
    setEditCta(item.payload.cta_label || "");
  };

  const saveEdit = async () => {
    if (!editId) return;
    setActionBusy(editId);
    try {
      setLastError(null);
      const res = await apiFetch(`/api/admin/retention/actions/${editId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editSubject, body: editBody, cta_label: editCta }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Edit error ${res.status}: ${txt}`);
      }
      setEditId(null);
      await refreshPending();
    } catch (e) {
      setLastError((e as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const runNow = async (dryRun: boolean) => {
    setLoading(true);
    try {
      setLastError(null);
      const res = await apiFetch("/api/admin/retention/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(
          `Run error ${res.status}: ${txt}\n\nTip: configure BACKEND_URL + BACKEND_ADMIN_TOKEN in backoffice env and restart.`,
        );
      }
      await refreshAll();
      await refreshPending();
      await refreshHistory({ page: 1 });
    } catch (e) {
      setLastError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Retention"
      />

      <div className="text-sm text-slate-600 dark:text-slate-300">
        Smart Subscription Retention — KPI, actions, validation.
      </div>

      {lastError ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20">
          <div className="text-sm font-semibold text-red-800 dark:text-red-200">
            Erreur
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-red-800/90 dark:text-red-200/90">
            {lastError}
          </pre>
          <div className="mt-3 text-xs text-red-700 dark:text-red-300">
            Si tu utilises le bouton “Run”, configure <code>BACKEND_URL</code> et{" "}
            <code>BACKEND_ADMIN_TOKEN</code> dans l’env du backoffice, puis
            redémarre <code>npm run dev</code>.
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={tab === "overview" ? "primary" : "secondary"}
          onClick={() => setTab("overview")}
        >
          Aperçu
        </Button>
        <Button
          variant={tab === "pending" ? "primary" : "secondary"}
          onClick={() => setTab("pending")}
        >
          Cas en attente
          {kpis?.pendingReview ? (
            <span className="ml-2 rounded-md bg-white/15 px-2 py-0.5 text-xs">
              {kpis.pendingReview}
            </span>
          ) : null}
        </Button>
        <Button
          variant={tab === "history" ? "primary" : "secondary"}
          onClick={() => setTab("history")}
        >
          Historique
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => runNow(true)}>
            Run (dry)
          </Button>
          <Button onClick={() => runNow(false)}>Run maintenant</Button>
          <Button variant="secondary" onClick={() => refreshAll()}>
            Rafraîchir KPI
          </Button>
        </div>
      </div>

      {loading && !kpis ? (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      ) : null}

      {tab === "overview" && kpis ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Actions (7j)
              </div>
              <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {formatNumber(kpis.actionsLast7d)}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Actions (30j)
              </div>
              <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {formatNumber(kpis.actionsLast30d)}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Open / Click / Conv (30j)
              </div>
              <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                {pct(kpis.openRate30d)} / {pct(kpis.clickRate30d)} /{" "}
                {pct(kpis.conversionRate30d)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                (estimations via events OPENED/CLICKED/CONVERTED)
              </div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Revenu sauvé (30j)
              </div>
              <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {money(kpis.revenueSavedEur30d)}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Actions / jour (30 jours)
                </div>
              </div>
              <div className="mt-4 flex h-28 items-end gap-1">
                {kpis.timeseries.map((t) => {
                  const h = maxTs > 0 ? Math.max(2, (t.count / maxTs) * 112) : 2;
                  return (
                    <div key={t.date} className="group relative flex-1">
                      <div
                        className="w-full rounded-md bg-blue-500/70 transition-all group-hover:bg-blue-500"
                        style={{ height: `${h}px` }}
                        title={`${t.date}: ${t.count}`}
                      />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Segments (7 jours)
              </div>
              <div className="mt-4 space-y-2">
                {kpis.segmentsLast7d.slice(0, 12).map((s) => (
                  <div key={s.segment} className="flex items-center justify-between">
                    <SegmentBadge seg={s.segment} />
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatNumber(s.count)}
                    </div>
                  </div>
                ))}
                {kpis.segmentsLast7d.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Aucun segment sur 7 jours.
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "pending" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => refreshPending()}>
              Rafraîchir
            </Button>
            {pendingLoading ? <Spinner /> : null}
          </div>

          {pending.length === 0 ? (
            <Card>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Aucun cas en attente.
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <motion.div key={p.id} layout>
                  <Card className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <SegmentBadge seg={p.segment} />
                        <Badge variant="info">{p.channel}</Badge>
                        {p.promoCode ? (
                          <Badge variant="purple">Promo: {p.promoCode}</Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-end">
                          <div>
                            {p.userName || "User"} • {String(p.createdAt)}
                          </div>
                          <div className="opacity-90">
                            {p.userEmail ? `Email: ${p.userEmail}` : "Email: —"} •{" "}
                            <span className="font-mono">ID: {p.userId}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {p.payload.subject}
                      </div>
                      <div className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">
                        {p.payload.body}
                      </div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        CTA: {p.payload.cta_label}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() => approve(p.id)}
                        disabled={actionBusy === p.id}
                      >
                        Valider & envoyer
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openEdit(p)}
                        disabled={actionBusy === p.id}
                      >
                        Éditer
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => reject(p.id)}
                        disabled={actionBusy === p.id}
                      >
                        Refuser
                      </Button>
                      {actionBusy === p.id ? <Spinner /> : null}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {editId ? (
            <Card className="space-y-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Éditer le message (ID: {editId})
              </div>
              <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} placeholder="Subject" />
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                placeholder="Body"
              />
              <Input value={editCta} onChange={(e) => setEditCta(e.target.value)} placeholder="CTA label" />
              <div className="flex items-center gap-2">
                <Button onClick={saveEdit} disabled={actionBusy === editId}>
                  Sauvegarder
                </Button>
                <Button variant="secondary" onClick={() => setEditId(null)}>
                  Annuler
                </Button>
                {actionBusy === editId ? <Spinner /> : null}
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="space-y-4">
          <Card className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="grid w-full grid-cols-1 gap-3 md:max-w-3xl md:grid-cols-3">
              <div>
                <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">Segment</div>
                <Input value={historySegment} onChange={(e) => setHistorySegment(e.target.value)} placeholder="ex: WIN_BACK_30" />
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">Status</div>
                <Input value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)} placeholder="ex: SENT" />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="secondary" onClick={() => refreshHistory({ page: 1 })}>
                  Filtrer
                </Button>
                {historyLoading ? <Spinner /> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => refreshHistory({ page: Math.max(1, historyPage - 1) })}
                disabled={historyPage <= 1}
              >
                Précédent
              </Button>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Page {historyPage} / {historyTotalPages}
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  refreshHistory({ page: Math.min(historyTotalPages, historyPage + 1) })
                }
                disabled={historyPage >= historyTotalPages}
              >
                Suivant
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            {history.map((h) => (
              <Card key={h.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SegmentBadge seg={h.segment} />
                    <Badge variant="info">{h.status}</Badge>
                    <Badge variant="default">{h.channel}</Badge>
                    {h.promoCode ? (
                      <Badge variant="purple">Promo: {h.promoCode}</Badge>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {h.userName || h.userEmail || h.userId} • {String(h.createdAt)}
                  </div>
                </div>

                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {h.payload.subject}
                </div>
                <div className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">
                  {h.payload.body}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span>Opens: {h.opens}</span>
                  <span>Clicks: {h.clicks}</span>
                  <span>Conversions: {h.conversions}</span>
                </div>
              </Card>
            ))}

            {history.length === 0 ? (
              <Card>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Aucun historique.
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

