import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, MessageSquare, Heart, Send, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listThreads, getThread, createThread, createReply } from "@/server/host-tools.functions";

type Thread = {
  id: string;
  title: string;
  body: string;
  author_name: string | null;
  reply_count: number;
  like_count: number;
  is_pinned: boolean;
  last_activity_at: string;
  created_at: string;
  user_id: string;
};

type Reply = {
  id: string;
  body: string;
  author_name: string | null;
  like_count: number;
  created_at: string;
  user_id: string;
};

export function MessageBoard() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = (data.user.user_metadata || {}) as Record<string, unknown>;
        const name =
          (typeof meta.display_name === "string" && meta.display_name) ||
          (typeof meta.full_name === "string" && meta.full_name) ||
          (data.user.email ? data.user.email.split("@")[0] : "Pool Host");
        setUser({ id: data.user.id, name });
      }
    });
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    const { threads } = await listThreads();
    setThreads(threads as Thread[]);
    setLoading(false);
  };

  const openThread = async (t: Thread) => {
    setActive(t);
    const res = await getThread({ data: { id: t.id } });
    setReplies(res.replies as Reply[]);
  };

  if (active) {
    return <ThreadView thread={active} replies={replies} user={user} onBack={() => { setActive(null); refresh(); }} onReply={async () => { const res = await getThread({ data: { id: active.id } }); setReplies(res.replies as Reply[]); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Pool Host Discussions</h2>
          <p className="text-sm text-muted-foreground">Share tips, ask questions, connect with other hosts.</p>
        </div>
        {user ? (
          <button onClick={() => setShowCompose((s) => !s)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95">
            <Plus className="h-4 w-4" /> New thread
          </button>
        ) : (
          <Link to="/auth" search={{ redirect: "/host-tools", mode: "signin" }} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95">
            Sign in to post
          </Link>
        )}
      </div>

      {showCompose && user && (
        <ComposeThread user={user} onCreated={() => { setShowCompose(false); refresh(); }} />
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No threads yet. Be the first to start a discussion!
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((t) => (
            <button key={t.id} onClick={() => openThread(t)} className="block w-full rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">{t.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">by {t.author_name || "Pool Host"} · {new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {t.reply_count}</span>
                  <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {t.like_count}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ComposeThread({ user, onCreated }: { user: { id: string; name: string }; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (title.trim().length < 3 || body.trim().length < 5) {
      setErr("Title and body are required.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await createThread({ data: { title, body, user_id: user.id, author_name: user.name } });
      setTitle(""); setBody("");
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Thread title..." className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your question, tip, or experience..." rows={5} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      {err && <p className="text-xs text-destructive">{err}</p>}
      <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post thread
      </button>
    </div>
  );
}

function ThreadView({ thread, replies, user, onBack, onReply }: {
  thread: Thread; replies: Reply[]; user: { id: string; name: string } | null;
  onBack: () => void; onReply: () => void;
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user || body.trim().length < 2) return;
    setSubmitting(true);
    try {
      await createReply({ data: { thread_id: thread.id, body, user_id: user.id, author_name: user.name } });
      setBody("");
      onReply();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-primary hover:underline">← Back to all threads</button>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold text-foreground">{thread.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">by {thread.author_name || "Pool Host"} · {new Date(thread.created_at).toLocaleDateString()}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{thread.body}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{replies.length} {replies.length === 1 ? "reply" : "replies"}</h3>
        {replies.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{r.author_name || "Pool Host"} · {new Date(r.created_at).toLocaleDateString()}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{r.body}</p>
          </div>
        ))}
      </div>

      {user ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply..." rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          <button onClick={submit} disabled={submitting || !body.trim()} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Reply
          </button>
        </div>
      ) : (
        <Link to="/auth" search={{ redirect: "/host-tools", mode: "signin" }} className="block rounded-2xl border border-dashed border-border p-6 text-center text-sm text-primary hover:underline">
          Sign in to reply →
        </Link>
      )}
    </div>
  );
}
