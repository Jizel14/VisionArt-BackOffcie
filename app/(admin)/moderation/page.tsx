"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle2, XCircle, MessageSquare, Palette, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import { formatDateTime } from "@/lib/utils";
import { apiFetch } from "@/lib/auth/api-client";

interface ModerationItem {
  id: string;
  contentType: "artwork" | "comment";
  contentText: string;
  imageUrl: string | null;
  moderationStatus: string;
  moderationReason: string | null;
  createdAt: string;
  author: { id: string; name: string; email: string } | null;
}

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/moderation?pageSize=50");
      const data = await res.json() as { items: ModerationItem[]; total: number };
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAction = async (item: ModerationItem, action: "approve" | "reject") => {
    const key = `${item.id}-${action}`;
    setActionLoading(key);
    try {
      await apiFetch(`/api/admin/moderation/${item.contentType}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setTotal((t) => t - 1);
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Modération IA" />
      <div className="flex items-center justify-between px-6 pb-2 pt-1">
        <p className="text-sm text-slate-500">
          {total} élément{total !== 1 ? "s" : ""} en attente de révision
        </p>
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500"
          >
            <ShieldAlert className="h-12 w-12 text-slate-600" />
            <p className="text-lg font-medium text-slate-400">Aucun contenu en attente</p>
            <p className="text-sm">Tout le contenu a été modéré.</p>
          </motion.div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Type icon */}
                    <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                      {item.contentType === "artwork" ? (
                        <Palette className="h-5 w-5 text-amber-400" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-amber-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="warning">
                          {item.contentType === "artwork" ? "Artwork" : "Commentaire"}
                        </Badge>
                        <Badge variant="warning">pending_review</Badge>
                        {item.moderationReason && (
                          <span className="text-xs text-slate-400 italic">
                            {item.moderationReason}
                          </span>
                        )}
                      </div>

                      {/* Text content */}
                      <p className="text-sm text-slate-300 mt-2 line-clamp-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        {item.contentText}
                      </p>

                      {/* Artwork thumbnail */}
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt="artwork"
                          className="mt-2 h-20 w-20 rounded-lg object-cover border border-slate-700"
                        />
                      )}

                      {/* Author + date */}
                      <div className="flex items-center gap-3 mt-3">
                        {item.author && (
                          <>
                            <Avatar name={item.author.name} size="sm" />
                            <span className="text-xs text-slate-400">
                              {item.author.name} · {item.author.email}
                            </span>
                          </>
                        )}
                        <span className="text-xs text-slate-500 ml-auto">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAction(item, "approve")}
                        disabled={actionLoading !== null}
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        {actionLoading === `${item.id}-approve` ? (
                          <Spinner size="sm" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        )}
                        Approuver
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleAction(item, "reject")}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === `${item.id}-reject` ? (
                          <Spinner size="sm" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1.5" />
                        )}
                        Rejeter
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
