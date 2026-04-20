"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Send, CheckCircle2, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function AnnouncementsPage() {
  const [message, setMessage] = useState("");
  const [current, setCurrent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/announcements")
      .then((r) => r.json())
      .then((d) => { if (d?.message) setCurrent(d.message); })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setOk(false);
    setError(null);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setCurrent(message.trim());
      setMessage("");
      setOk(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setError(null);
    try {
      await fetch("/api/admin/announcements", { method: "DELETE" });
      setCurrent(null);
    } catch {
      setError("Impossible de supprimer");
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <Header title="Annonces" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 p-6 max-w-2xl"
      >
        {/* Current active banner preview */}
        {current && (
          <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white shadow-md">
            <Megaphone className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm font-medium">{current}</p>
            <button
              onClick={handleClear}
              disabled={clearing}
              className="rounded p-0.5 opacity-70 hover:opacity-100"
              title="Supprimer le bandeau"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {current ? "Modifier le bandeau" : "Publier un bandeau"}
              </h2>
              <p className="text-sm text-slate-500">
                Un seul message s&apos;affiche en haut de l&apos;application mobile pour tous les utilisateurs.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Message du bandeau *
              </label>
              <textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value); setOk(false); }}
                placeholder="Ex: 🎉 Nouvelle fonctionnalité disponible — découvrez les collections !"
                rows={3}
                maxLength={200}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 resize-none"
              />
              <p className="mt-1 text-xs text-slate-400">{message.length}/200</p>
            </div>

            {ok && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Bandeau publié — visible sur l&apos;app mobile.
              </div>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                Erreur: {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                loading={sending}
                disabled={!message.trim()}
                icon={<Send className="h-4 w-4" />}
                onClick={handleSend}
              >
                Publier
              </Button>
              {current && (
                <Button
                  variant="danger"
                  size="md"
                  loading={clearing}
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={handleClear}
                >
                  Retirer le bandeau
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
}
