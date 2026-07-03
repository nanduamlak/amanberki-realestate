"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRole } from "@/lib/RoleContext";
import {
  useAttentionStore,
  setGlobalUnreadCount,
  type AttentionMessage,
} from "@/lib/useAttentionStore";
import {
  Send, Pencil, Trash2, X, Check, MessageSquareWarning,
  ShieldCheck, User as UserIcon, Clock, CheckCheck,
} from "lucide-react";
import { toast } from "@/lib/toast";

// ─── Helpers ─────────────────────────────────────────────────
function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7)  return `${d.toLocaleDateString("en-GB", { weekday: "short" })} ${time}`;
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${time}`;
}

function dateDivider(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function getRolePill(role: string) {
  const map: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700",
    admin:       "bg-blue-100 text-blue-700",
    user:        "bg-slate-100 text-slate-600",
    agent:       "bg-emerald-100 text-emerald-700",
    viewer:      "bg-gray-100 text-gray-500",
  };
  const label: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    user: "User",
    agent: "Agent",
    viewer: "Viewer",
  };
  return { cls: map[role] ?? "bg-gray-100 text-gray-500", label: label[role] ?? role };
}

// ─── Message bubble ───────────────────────────────────────────
function MessageBubble({
  msg,
  showDivider,
  dividerLabel,
  onEdit,
  onDelete,
}: {
  msg: AttentionMessage;
  showDivider: boolean;
  dividerLabel: string;
  onEdit: (msg: AttentionMessage) => void;
  onDelete: (id: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const rolePill = getRolePill(msg.createdByRole);

  return (
    <>
      {showDivider && (
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap px-2">
            {dividerLabel}
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      )}

      <div
        className={`flex items-end gap-2 mb-1.5 group ${msg.isMine ? "flex-row-reverse" : "flex-row"}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Avatar */}
        {!msg.isMine && (
          <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-black shadow mb-0.5">
            {msg.createdByName.slice(0, 1).toUpperCase()}
          </div>
        )}

        {/* Bubble */}
        <div className={`flex flex-col max-w-[70%] ${msg.isMine ? "items-end" : "items-start"}`}>
          {/* Name + role (others only) */}
          {!msg.isMine && (
            <div className="flex items-center gap-1.5 mb-1 ml-1">
              <span className="text-[11px] font-black text-slate-700">{msg.createdByName}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${rolePill.cls}`}>
                {rolePill.label}
              </span>
            </div>
          )}

          <div className="relative">
            {/* Action buttons (only on mine, on hover) */}
            {msg.isMine && hovered && (
              <div className="absolute -left-16 bottom-1 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-slate-100 p-1">
                <button
                  onClick={() => onEdit(msg)}
                  className="p-1.5 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => onDelete(msg.id)}
                  className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}

            {/* Bubble body */}
            <div
              className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words ${
                msg.isMine
                  ? "bg-[#0086D1] text-white rounded-br-sm"
                  : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"
              }`}
            >
              {msg.body}
            </div>

            {/* Time + edited indicator */}
            <div className={`flex items-center gap-1 mt-0.5 px-1 ${msg.isMine ? "justify-end" : "justify-start"}`}>
              {msg.isEdited && (
                <span className={`text-[9px] font-semibold ${msg.isMine ? "text-blue-200" : "text-slate-400"}`}>
                  edited
                </span>
              )}
              <span className={`text-[9px] font-medium ${msg.isMine ? "text-blue-200" : "text-slate-400"}`}>
                {formatTime(msg.createdAt)}
              </span>
              {msg.isMine && <CheckCheck size={11} className="text-blue-200" />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function AttentionRemarksPage() {
  const { user } = useRole();
  const {
    messages, ready,
    refreshMessages, markAllRead,
    addMessage, updateMessage, removeMessage,
  } = useAttentionStore();

  const [input, setInput]           = useState("");
  const [sending, setSending]       = useState(false);
  const [editingMsg, setEditingMsg] = useState<AttentionMessage | null>(null);
  const [editBody, setEditBody]     = useState("");
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // On mount: load messages & mark as read
  useEffect(() => {
    refreshMessages();
    markAllRead().then(() => setGlobalUnreadCount(0));
  }, [refreshMessages, markAllRead]);

  // Auto-poll for new messages every 15s while page is open
  useEffect(() => {
    const interval = setInterval(refreshMessages, 15_000);
    return () => clearInterval(interval);
  }, [refreshMessages]);

  // Scroll to bottom when messages load or a new one arrives
  useEffect(() => {
    if (ready) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, ready]);

  // ── Send ──────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const body = input.trim();
    if (!body || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/attention-remarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error(await res.text());
      const msg: AttentionMessage = await res.json();
      addMessage(msg);
      setInput("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }, [input, sending, addMessage]);

  // ── Edit ─────────────────────────────────────────────────
  const handleEdit = useCallback(async () => {
    if (!editingMsg || !editBody.trim()) return;
    try {
      const res = await fetch(`/api/attention-remarks/${editingMsg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated: AttentionMessage = await res.json();
      updateMessage(updated);
      setEditingMsg(null);
      setEditBody("");
    } catch {
      toast.error("Failed to edit message");
    }
  }, [editingMsg, editBody, updateMessage]);

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/attention-remarks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      removeMessage(id);
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete message");
    }
  }, [removeMessage]);

  // ── Keyboard shortcuts ───────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEdit(); }
    if (e.key === "Escape") { setEditingMsg(null); setEditBody(""); }
  };

  // ── Date dividers ────────────────────────────────────────
  let lastDateStr = "";

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-slate-100 shadow-sm px-6 py-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
          <MessageSquareWarning size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-black text-slate-900 leading-none">Attention Remarks</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {messages.length === 0 ? "Group chat — start the conversation" : `${messages.length} message${messages.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-full">
            <Clock size={10} />
            Auto-refreshes every 15s
          </div>
        </div>
      </div>

      {/* ── Chat area ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)", backgroundSize: "24px 24px" }}>
        <div className="max-w-3xl mx-auto px-4">
          {!ready ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-[#0086D1]/20 border-t-[#0086D1] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">Loading messages…</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <MessageSquareWarning size={30} className="text-amber-500" />
                </div>
                <p className="font-bold text-slate-700 text-base">No messages yet</p>
                <p className="text-sm text-slate-400 mt-1">Be the first to post an attention remark.</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => {
                const msgDate = dateDivider(msg.createdAt);
                const showDivider = msgDate !== lastDateStr;
                lastDateStr = msgDate;
                return (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    showDivider={showDivider}
                    dividerLabel={msgDate}
                    onEdit={(m) => { setEditingMsg(m); setEditBody(m.body); }}
                    onDelete={(id) => setDeleteId(id)}
                  />
                );
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>

      {/* ── Compose bar ────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-t border-slate-100 px-4 py-3">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          {/* Current user avatar */}
          <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-[#0086D1] to-[#005fa3] flex items-center justify-center text-white text-xs font-black shadow mb-0.5">
            {user?.name ? user.name.slice(0, 1).toUpperCase() : <UserIcon size={14} />}
          </div>

          {/* Text area */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write an attention remark… (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{ resize: "none", minHeight: "44px", maxHeight: "140px" }}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0086D1]/30 focus:border-[#0086D1] transition-all leading-relaxed"
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
              }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 h-11 w-11 rounded-full bg-[#0086D1] hover:bg-[#006daa] disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center text-white shadow-md shadow-[#0086D1]/30 transition-all active:scale-95 mb-0.5"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
          Hover over your messages to edit or delete · Press <kbd className="bg-slate-100 px-1 rounded text-[9px]">Enter</kbd> to send
        </p>
      </div>

      {/* ── Edit modal ─────────────────────────────────────── */}
      {editingMsg && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setEditingMsg(null); setEditBody(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pencil size={16} className="text-[#0086D1]" />
                <h3 className="font-black text-slate-900 text-base">Edit Message</h3>
              </div>
              <button onClick={() => { setEditingMsg(null); setEditBody(""); }} className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                <X size={14} />
              </button>
            </div>
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              onKeyDown={handleEditKeyDown}
              autoFocus
              rows={4}
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0086D1]/30 focus:border-[#0086D1] transition-all resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1 mb-4">Enter to save · Esc to cancel</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setEditingMsg(null); setEditBody(""); }} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={!editBody.trim() || editBody.trim() === editingMsg.body}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-[#0086D1] text-white hover:bg-[#006daa] disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center gap-1.5"
              >
                <Check size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ────────────────────────────── */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-black text-slate-900 text-base text-center">Delete Message?</h3>
            <p className="text-sm text-slate-500 text-center mt-1 mb-5">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
