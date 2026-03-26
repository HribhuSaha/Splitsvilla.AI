import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Auth Types & Hook ──────────────────────────────────────────────
export interface CupidAuthUser {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
}

interface AuthState {
  user: CupidAuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  register: (data: { username: string; password: string; firstName?: string; lastName?: string }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

export function useCupidAuth(): AuthState {
  const [user, setUser] = useState<CupidAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/cupid/auth/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ user: CupidAuthUser | null }>;
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch("/api/cupid/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Login failed" };
      setUser(data.user);
      return {};
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const register = useCallback(async (regData: { username: string; password: string; firstName?: string; lastName?: string }): Promise<{ error?: string }> => {
    try {
      const res = await fetch("/api/cupid/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(regData),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Registration failed" };
      setUser(data.user);
      return {};
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/cupid/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    window.location.href = "/login";
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}

// ─── Profile Types ──────────────────────────────────────────────────
export interface CupidProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  bio: string;
  gender: string;
  interestedIn: string[];
  photoUrl: string | null;
  location: string | null;
  createdAt: string;
}

// ─── Match Types ────────────────────────────────────────────────────
export interface CupidMatchData {
  id: string;
  otherProfile: CupidProfile | null;
  womenMustMessageFirst: boolean;
  messageDeadline: string | null;
  canMessage: boolean;
  lastMessage: CupidMessageData | null;
  createdAt: string;
}

export interface CupidMessageData {
  id: string;
  matchId: string;
  senderId: string;
  content: string | null;
  encryptedContent: string | null;
  iv: string | null;
  encryptedKeyForSender: string | null;
  encryptedKeyForRecipient: string | null;
  createdAt: string;
}

// ─── API Hooks ──────────────────────────────────────────────────────

const BASE = "/api/cupid";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export function useCupidProfile() {
  return useQuery<CupidProfile>({
    queryKey: ["cupid", "profile", "me"],
    queryFn: () => fetchJson(`${BASE}/profiles/me`),
    retry: false,
  });
}

export function useUpsertCupidProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CupidProfile>) =>
      fetchJson<CupidProfile>(`${BASE}/profiles/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cupid", "profile"] });
    },
  });
}

export function useUploadCupidImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await fetch(`${BASE}/profiles/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      
      return res.json() as Promise<{ url: string }>;
    },
  });
}

export function useDiscoverProfiles(enabled: boolean) {
  return useQuery<CupidProfile[]>({
    queryKey: ["cupid", "discover"],
    queryFn: () => fetchJson(`${BASE}/profiles/discover`),
    enabled,
    refetchOnWindowFocus: false,
  });
}

export function useCreateSwipe() {
  return useMutation({
    mutationFn: (data: { targetUserId: string; direction: "like" | "pass" }) =>
      fetchJson<{ matched: boolean; matchId: string | null }>(`${BASE}/swipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });
}

export function useCupidMatches(enabled: boolean) {
  return useQuery<CupidMatchData[]>({
    queryKey: ["cupid", "matches"],
    queryFn: () => fetchJson(`${BASE}/matches`),
    enabled,
    refetchInterval: 5000,
  });
}

export function useCupidMessages(matchId: string) {
  return useQuery<CupidMessageData[]>({
    queryKey: ["cupid", "messages", matchId],
    queryFn: () => fetchJson(`${BASE}/matches/${matchId}/messages`),
    refetchInterval: 3000,
  });
}

export function useGetCupidAuthUser() {
  return useQuery<{ user: CupidAuthUser | null }>({
    queryKey: ["cupid", "auth", "user"],
    queryFn: () => fetchJson(`${BASE}/auth/user`),
  });
}
