"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Shield,
  User,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";

interface HealthData {
  status: string;
  latency?: string;
  database?: string;
  host?: string;
  error?: string;
}

export default function SettingsPage() {
  const { admin } = useAuth();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/health");
      setHealth(await res.json());
    } catch {
      setHealth({ status: "disconnected", error: "Fetch failed" });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <>
      <Header title="Paramètres" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-3xl space-y-6 p-6"
      >
        {/* Admin profile */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Administrateur connecté
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                {admin?.email || "..."}
              </p>
            </div>
            <Badge variant="purple" className="ml-auto">
              {admin?.role || "admin"}
            </Badge>
          </div>
        </Card>

        {/* Database status */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <Database className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Base de données
                </h3>
                {health ? (
                  <div className="mt-1 flex items-center gap-2">
                    {health.status === "connected" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-emerald-600">
                          Connecté
                        </span>
                        <span className="text-xs text-slate-400">
                          {health.database}@{health.host} &middot;{" "}
                          {health.latency}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">
                          Déconnecté
                        </span>
                        {health.error && (
                          <span className="text-xs text-slate-400">
                            {health.error}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">Vérification...</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={checking}
              onClick={checkHealth}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Tester
            </Button>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Sécurité
              </h3>
              <p className="mt-0.5 text-sm text-slate-400">
                JWT tokens avec expiration 8h &middot; Routes API protégées par middleware
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-700">
            <div>
              <p className="text-slate-400">Authentification</p>
              <p className="text-slate-700 dark:text-slate-300">JWT + Cookie httpOnly</p>
            </div>
            <div>
              <p className="text-slate-400">Expiration session</p>
              <p className="text-slate-700 dark:text-slate-300">8 heures</p>
            </div>
            <div>
              <p className="text-slate-400">Middleware</p>
              <Badge variant="success">Actif</Badge>
            </div>
            <div>
              <p className="text-slate-400">Rate limiting</p>
              <Badge variant="warning">Non configuré</Badge>
            </div>
          </div>
        </Card>

        {/* System info */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Informations système
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Framework</p>
              <p className="text-slate-700 dark:text-slate-300">Next.js 16</p>
            </div>
            <div>
              <p className="text-slate-400">Runtime</p>
              <p className="text-slate-700 dark:text-slate-300">Node.js</p>
            </div>
            <div>
              <p className="text-slate-400">Base de données</p>
              <p className="text-slate-700 dark:text-slate-300">MySQL</p>
            </div>
            <div>
              <p className="text-slate-400">Port</p>
              <p className="text-slate-700 dark:text-slate-300">3001</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
}
