"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Send, Copy, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/auth/api-client";
import type { CopilotMessage, CopilotResponse } from "@/types/copilot";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer } from "recharts";

const SUGGESTIONS = [
  "Combien d'utilisateurs actifs ?",
  "Top 10 artworks les plus aimés (titre et likes_count)",
  "Nombre d'inscriptions par jour (7 derniers jours)",
  "Derniers utilisateurs inscrits",
];

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const t = value.trim();
  if (!t) return value;
  if (!(t.startsWith("{") || t.startsWith("["))) return value;
  try {
    return JSON.parse(t);
  } catch {
    return value;
  }
}

function formatCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-slate-400">—</span>;
  }
  if (typeof value === "boolean") {
    return value ? "✓" : "✗";
  }
  if (typeof value === "number") {
    return new Intl.NumberFormat().format(value);
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    if (parsed !== value && (typeof parsed === "object")) {
      return <PrettyJson value={parsed} />;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toLocaleString();
    }
    if (value.length > 80) {
      return <span title={value}>{value.slice(0, 77)}…</span>;
    }
    return value;
  }
  if (typeof value === "object") {
    return <PrettyJson value={value} />;
  }
  return String(value);
}

function PrettyJson({ value }: { value: unknown }) {
  if (value === null) return <span className="text-slate-400">null</span>;
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.slice(0, 6).map((v, i) => (
          <span
            key={i}
            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {typeof v === "object" ? JSON.stringify(v) : String(v)}
          </span>
        ))}
        {value.length > 6 && (
          <span className="text-[11px] text-slate-500">+{value.length - 6}</span>
        )}
      </div>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div className="flex flex-col gap-0.5">
        {entries.slice(0, 6).map(([k, v]) => (
          <div key={k} className="flex gap-1.5 text-[11px] leading-tight">
            <span className="font-medium text-slate-500 dark:text-slate-400">{k}:</span>
            <span className="text-slate-700 dark:text-slate-200">
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))}
        {entries.length > 6 && (
          <span className="text-[11px] text-slate-500">+{entries.length - 6} fields</span>
        )}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

export default function ChatDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CopilotResponse | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Seed a welcome message once.
    setMessages((prev) =>
      prev.length > 0
        ? prev
        : [
            {
              id: uid(),
              role: "assistant",
              content: "Pose-moi une question admin, je génère une requête SQL SELECT et j'affiche le résultat.",
              createdAt: Date.now(),
            },
          ]
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [open, messages, loading, lastResult]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q) return;

    setLastResult(null);
    setLoading(true);
    setMessages((m) => [
      ...m,
      { id: uid(), role: "user", content: q, createdAt: Date.now() },
    ]);
    setInput("");

    try {
      const res = await apiFetch("/api/admin/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data?.error || "Copilot error");

      setLastResult(data as CopilotResponse);
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content: "Voici le résultat.",
          createdAt: Date.now(),
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content:
            e instanceof Error ? `Erreur: ${e.message}` : "Erreur: requête impossible",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside
        className={cn(
          "absolute right-0 top-0 h-full w-[450px] max-w-[95vw] border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        )}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Admin Copilot 🤖
              </div>
              <div className="text-xs text-slate-500">Ollama → SQL → MySQL</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div ref={scrollRef} className="h-[calc(100%-140px)] overflow-auto px-4 py-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "mb-3 flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="mb-3 text-sm text-slate-500">Analyse…</div>
          )}

          {lastResult && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  SQL généré
                </div>
                <button
                  onClick={() => copy(lastResult.sql)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copier
                </button>
              </div>
              <pre className="mt-2 overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                {lastResult.sql}
              </pre>

              <div className="mt-3">
                {lastResult.kind === "metric" && lastResult.metric && (
                  <div className="rounded-xl bg-violet-600/10 p-4">
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      {lastResult.metric.label}
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {String(lastResult.metric.value)}
                    </div>
                  </div>
                )}

                {lastResult.kind === "table" && lastResult.table && (
                  <div className="overflow-auto">
                    <table className="mt-2 w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          {lastResult.table.columns.map((c) => (
                            <th key={c} className="py-2 pr-3 font-semibold text-slate-700 dark:text-slate-200">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lastResult.table.rows.slice(0, 20).map((r, idx) => (
                          <tr key={idx} className="border-b border-slate-100 dark:border-slate-900">
                            {lastResult.table!.columns.map((c) => (
                              <td key={c} className="max-w-[280px] py-2 pr-3 align-top text-slate-700 dark:text-slate-200">
                                {formatCell(r[c])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        Affichage {Math.min(20, lastResult.table.rows.length)} / {lastResult.table.rows.length}
                      </div>
                      <button
                        onClick={() => copy(JSON.stringify(lastResult.table?.rows ?? [], null, 2))}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-900"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copier JSON
                      </button>
                    </div>
                  </div>
                )}

                {lastResult.kind === "bar" && lastResult.chart && (
                  <div className="mt-2 h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lastResult.chart.data as any}>
                        <XAxis dataKey={lastResult.chart.xKey} tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RTooltip />
                        <Bar dataKey={lastResult.chart.yKey} fill="#6C63FF" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => copy(JSON.stringify(lastResult.chart?.data ?? [], null, 2))}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copier données
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {messages.length <= 1 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Suggestions rapides
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pose ta question…"
              rows={2}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) void ask(input);
                }
              }}
            />
            <Button
              variant="primary"
              size="md"
              loading={loading}
              disabled={!canSend}
              icon={<Send className="h-4 w-4" />}
              onClick={() => void ask(input)}
              className="bg-violet-600 hover:bg-violet-700 active:bg-violet-800 focus-visible:ring-violet-500"
              aria-label="Envoyer"
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            SHIFT+Enter pour nouvelle ligne. SELECT only · LIMIT 500 · 10s max.
          </div>
        </footer>
      </aside>
    </div>
  );
}

