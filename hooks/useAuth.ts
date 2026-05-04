"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/api-client";

interface Admin {
  id?: number;
  email: string;
  role: string;
  permissions?: string[];
}

export function useAuth() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAdmin(data))
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false));
  }, []);

  return { admin, loading, isAuthenticated: !!admin };
}
