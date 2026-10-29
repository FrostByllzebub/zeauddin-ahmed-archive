"use client";
import { useEffect, useState } from "react";
import { memoryApi, memoryStatus } from "../lib/memory-client";
type Memory = {
  id: string;
  name: string;
  public_name: string;
  anonymous: number;
  email: string;
  phone: string | null;
  relationship: string;
  title: string;
  story: string;
  photo_key: string | null;
  photo_caption: string | null;
  photo_date: string | null;
  consent_story: number;
  consent_photo: number;
  consent_contact: number;
  status: string;
  note: string | null;
  created_at: string;
};
type Correction = {
  id: string;
  memory_id: string;
  title: string;
  message: string;
};
type Event = { action: string; actor: string; created_at: string };
export function AdminModerationDashboard() {
  const [status, setStatus] = useState("pending"),
    [items, setItems] = useState<Memory[]>([]),
    [requests, setRequests] = useState<Correction[]>([]),
    [selected, setSelected] = useState<Memory | null>(null),
    [message, setMessage] = useState(""),
    [locked, setLocked] = useState(false),
    [busy, setBusy] = useState(false),
    [edit, setEdit] = useState(false),
    [title, setTitle] = useState(""),
    [story, setStory] = useState(""),
    [note, setNote] = useState(""),
    [events, setEvents] = useState<Event[]>([]);
  async function load() {
    setBusy(true);
    try {
      const r = await fetch(
        `${memoryApi()}/api/memories/admin?status=${status}`,
        { credentials: "include", cache: "no-store" },
      );
      if (r.status === 401) {
        setLocked(true);
        setItems([]);
        setSelected(null);
        return;
      }
      if (!r.ok) throw Error("সম্পাদকীয় তালিকা খোলা যাচ্ছে না।");
      const data = (await r.json()) as {
        memories: Memory[];
        requests: Correction[];
      };
      setLocked(false);
      setItems(data.memories);
      setRequests(data.requests);
      setSelected(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, [status]);
  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title);
    setStory(selected.story);
    setNote(selected.note || "");
    setEdit(false);
    setEvents([]);
    fetch(`${memoryApi()}/api/memories/admin/${selected.id}/events`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => setEvents((d as { events: Event[] }).events))
      .catch(() => setMessage("সম্পাদনার ইতিহাস এখন খোলা যাচ্ছে না।"));
  }, [selected]);
  async function act(id: string, action: string, requestId?: string) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch(`${memoryApi()}/api/memories/admin/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, title, story, note, requestId }),
      });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(d.error || "কাজটি করা যায়নি।");
      await load();
      setMessage("সিদ্ধান্ত সংরক্ষিত হয়েছে।");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="memory-editor">
      <div className="memory-editor-toolbar">
        <p>ব্যক্তিগত জমা শুধু সাইটের মালিক দেখতে পারবেন।</p>
        <button className="button" disabled={busy} onClick={() => void load()}>
          হালনাগাদ
        </button>
      </div>
      {locked ? (
        <div className="memory-empty">
          <h2>সম্পাদকের সাইন-ইন প্রয়োজন</h2>
          <p>
            সাইটের মালিকের ChatGPT অ্যাকাউন্ট ব্যবহার করুন। অন্য অ্যাকাউন্ট থেকে
            ব্যক্তিগত জমা দেখা যাবে না।
          </p>
          <a
            className="button button-accent"
            href={`${memoryApi()}/signin-with-chatgpt?return_to=%2Fadmin`}
            target="_top"
          >
            নিরাপদ সাইন-ইন →
          </a>
        </div>
      ) : (
        <>
          <div
            className="memory-editor-tabs"
            role="group"
            aria-label="সম্পাদকীয় অবস্থা"
          >
            {Object.entries(memoryStatus).map(([key, label]) => (
              <button
                className={status === key ? "button button-accent" : "button"}
                key={key}
                aria-pressed={status === key}
                onClick={() => setStatus(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {requests.length > 0 && (
            <section className="memory-corrections">
              <h2>সংশোধনের অনুরোধ</h2>
              {requests.map((r) => (
                <article key={r.id}>
                  <h3>{r.title}</h3>
                  <p className="memory-story-text">{r.message}</p>
                  <small>জমার নম্বর: {r.memory_id}</small>
                  <button
                    className="memory-read-more"
                    disabled={busy}
                    onClick={() =>
                      void act(r.memory_id, "resolve_request", r.id)
                    }
                  >
                    সমাধান হয়েছে হিসেবে চিহ্নিত করুন
                  </button>
                </article>
              ))}
            </section>
          )}
          <div className="memory-editor-layout">
            <div className="memory-editor-list">
              <h2>{memoryStatus[status]}</h2>
              {!items.length ? (
                <p>এই তালিকায় কোনো জমা নেই।</p>
              ) : (
                items.map((m) => (
                  <button
                    key={m.id}
                    className={selected?.id === m.id ? "selected" : ""}
                    onClick={() => setSelected(m)}
                  >
                    <strong>{m.title}</strong>
                    <span>
                      {m.name} · {m.relationship}
                    </span>
                  </button>
                ))
              )}
            </div>
            {selected && (
              <article className="memory-editor-detail">
                <p className="eyebrow">
                  {memoryStatus[selected.status]} · {selected.id}
                </p>
                <h2>{selected.title}</h2>
                <dl className="memory-private-details">
                  <dt>ব্যক্তিগত নাম</dt>
                  <dd>{selected.name}</dd>
                  <dt>প্রকাশ্য পরিচয়</dt>
                  <dd>
                    {selected.anonymous
                      ? "নাম প্রকাশে অনিচ্ছুক"
                      : selected.public_name}
                  </dd>
                  <dt>ইমেইল (ব্যক্তিগত)</dt>
                  <dd>{selected.email}</dd>
                  <dt>ফোন (ব্যক্তিগত)</dt>
                  <dd>{selected.phone || "দেওয়া হয়নি"}</dd>
                </dl>
                <p>
                  গল্প প্রকাশের অনুমতি:{" "}
                  {selected.consent_story ? "হ্যাঁ" : "না"} · ছবি প্রকাশের
                  অনুমতি: {selected.consent_photo ? "হ্যাঁ" : "না"} · ভবিষ্যৎ
                  যোগাযোগ: {selected.consent_contact ? "হ্যাঁ" : "না"}
                </p>
                {selected.photo_key && (
                  <figure>
                    <img
                      src={`${memoryApi()}/api/memories/admin/${selected.id}/photo`}
                      alt={selected.photo_caption || "জমা দেওয়া ব্যক্তিগত ছবি"}
                    />
                    <figcaption>
                      {selected.photo_caption} {selected.photo_date}
                    </figcaption>
                  </figure>
                )}
                {edit ? (
                  <div className="memory-form">
                    <label className="memory-field">
                      শিরোনাম
                      <input
                        value={title}
                        maxLength={160}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </label>
                    <label className="memory-field">
                      গল্প
                      <textarea
                        value={story}
                        maxLength={6000}
                        rows={10}
                        onChange={(e) => setStory(e.target.value)}
                      />
                    </label>
                    <p>
                      প্রকাশিত পাঠ সম্পাদনা করলে সেটি আবার পর্যালোচিত অবস্থায়
                      যাবে; পুনরায় প্রকাশ করতে হবে।
                    </p>
                  </div>
                ) : (
                  <div className="memory-story-text">
                    {selected.story.split(/\n+/).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
                <label className="memory-field">
                  অভ্যন্তরীণ নোট
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={1000}
                  />
                </label>
                <div className="memory-button-row">
                  {edit ? (
                    <>
                      <button
                        className="button button-accent"
                        disabled={busy || story.length < 20 || !title.trim()}
                        onClick={() => void act(selected.id, "edit")}
                      >
                        সম্পাদনা সংরক্ষণ
                      </button>
                      <button className="button" onClick={() => setEdit(false)}>
                        বাতিল
                      </button>
                    </>
                  ) : (
                    <button className="button" onClick={() => setEdit(true)}>
                      পাঠ সম্পাদনা
                    </button>
                  )}
                  {!edit && selected.status === "pending" && (
                    <>
                      <button
                        className="button button-accent"
                        disabled={busy}
                        onClick={() => void act(selected.id, "review")}
                      >
                        পর্যালোচনা সম্পন্ন করুন
                      </button>
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() => void act(selected.id, "reject")}
                      >
                        প্রত্যাখ্যান
                      </button>
                    </>
                  )}
                  {!edit && selected.status === "reviewed" && (
                    <>
                      <button
                        className="button button-accent"
                        disabled={busy || !selected.consent_story}
                        onClick={() => void act(selected.id, "publish")}
                      >
                        অনুমোদন করে প্রকাশ করুন
                      </button>
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() => void act(selected.id, "reject")}
                      >
                        প্রত্যাখ্যান
                      </button>
                    </>
                  )}
                  {!edit && selected.status === "published" && (
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => void act(selected.id, "unpublish")}
                    >
                      প্রকাশ থেকে সরান
                    </button>
                  )}
                  {!edit && selected.status === "rejected" && (
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => void act(selected.id, "restore")}
                    >
                      আবার অপেক্ষমাণ করুন
                    </button>
                  )}
                </div>
                <details className="memory-events">
                  <summary>সম্পাদনার ইতিহাস</summary>
                  {events.map((e, i) => (
                    <p key={i}>
                      {memoryStatus[e.action] || e.action} · {e.actor} ·{" "}
                      {new Date(e.created_at).toLocaleString("bn-BD")}
                    </p>
                  ))}
                </details>
              </article>
            )}
          </div>
        </>
      )}
      {message && (
        <p role="status" className="memory-private-note">
          {message}
        </p>
      )}
    </div>
  );
}
