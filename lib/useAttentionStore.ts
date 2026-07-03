"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────
export interface AttentionMessage {
  id: number;
  body: string;
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isMine: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAttentionStore() {
  const [messages, setMessages]       = useState<AttentionMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ready, setReady]             = useState(false);

  // Lightweight unread-count fetch (used for sidebar badge every 30s)
  const refreshCount = useCallback(async () => {
    try {
      const res = await fetch("/api/attention-remarks/read");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch { /* silent */ }
  }, []);

  // Full message list fetch (used when the page is open)
  const refreshMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/attention-remarks");
      if (!res.ok) return;
      const data: AttentionMessage[] = await res.json();
      setMessages(data);
      setReady(true);
    } catch { /* silent */ }
  }, []);

  // Mark all as read (called when user visits the page)
  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/attention-remarks/read", { method: "POST" });
      setUnreadCount(0);
    } catch { /* silent */ }
  }, []);

  // Optimistically add a sent message
  const addMessage = useCallback((msg: AttentionMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  // Optimistically update an edited message
  const updateMessage = useCallback((updated: AttentionMessage) => {
    setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
  }, []);

  // Optimistically remove a deleted message
  const removeMessage = useCallback((id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  // Poll unread count every 30s (always running — for sidebar badge)
  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 30_000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  return {
    messages,
    unreadCount,
    ready,
    refreshMessages,
    refreshCount,
    markAllRead,
    addMessage,
    updateMessage,
    removeMessage,
    setUnreadCount,
  };
}

// ─── Singleton store for sidebar badge (shared across components) ──
// We use a simple module-level state with listeners rather than a context
// to keep it zero-dependency and compatible with the existing pattern.

type Listener = (count: number) => void;
const listeners = new Set<Listener>();
let globalCount = 0;

export function subscribeUnreadCount(fn: Listener) {
  listeners.add(fn);
  fn(globalCount); // immediately sync current value
  return () => listeners.delete(fn);
}

export function setGlobalUnreadCount(count: number) {
  globalCount = count;
  listeners.forEach(fn => fn(count));
}
