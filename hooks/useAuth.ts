"use client";

import { useEffect, useState } from "react";

interface Admin {
  email: string;
  role: string;
}

export function useAuth() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAdmin(data))
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false));
  }, []);

  return { admin, loading, isAuthenticated: !!admin };
}
