"use client";

import { useEffect, useMemo, useState } from "react";

type Memory = {
  id: string; first_name: string; last_name: string; email: string;
  relationship_to_zea: string; story: string; photo_key: string | null;
  photo_caption: string | null; consent_to_publish: number; consent_to_contact: number;
  moderation_status: string; moderation_note: string | null; created_at: string;
};
type AuditEvent = { id: number; action: string; actor_id: string | null; details: string | null; created_at: string };

const endpoint = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "";
const statusLabels = { pending: "অপেক্ষমাণ", approved: "প্রকাশিত", rejected: "প্রত্যাখ্যাত" } as const;

function adminForm(values: Record<string, string>) {
  const body = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => body.set(key, value));
  return body;
}

export function AdminModerationDashboard() {
  const [status, setStatus] = useState("pending");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selected, setSelected] = useState<Memory | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ firstName: "", lastName: "", relationship: "", story: "", photoCaption: "" });
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  const load = async () => {
    if (!endpoint) return setMessage("এই সংস্করণে সম্পাদকীয় API যুক্ত করা হয়নি।");
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${endpoint}/api/admin/memories?status=${status}`, { credentials: "include", cache: "no-store" });
      if (response.status === 401) throw new Error("সম্পাদকীয় তালিকা দেখতে Cloudflare Access-এ সাইন ইন করতে হবে।");
      if (!response.ok) throw new Error("সম্পাদকীয় তালিকা খোলা যাচ্ছে না।");
      const data = (await response.json()) as { memories: Memory[] };
      setMemories(data.memories);
      setSelected((current) => current && data.memories.some((item) => item.id === current.id) ? current : data.memories[0] ?? null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "সম্পাদকীয় তালিকা খোলা যাচ্ছে না।"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [status]);
  useEffect(() => {
    if (!selected || !endpoint) return;
    setEdit({ firstName: selected.first_name, lastName: selected.last_name, relationship: selected.relationship_to_zea, story: selected.story, photoCaption: selected.photo_caption ?? "" });
    setEditing(false);
    void fetch(`${endpoint}/api/admin/memories/${selected.id}/audit`, { credentials: "include", cache: "no-store" })
      .then((response) => response.ok ? response.json() : { events: [] })
      .then((data) => setAuditEvents((data as { events: AuditEvent[] }).events));
  }, [selected]);
  const counts = useMemo(() => ({ total: memories.length, withPhotos: memories.filter((item) => item.photo_key).length }), [memories]);

  const decide = async (action: "approve" | "reject" | "restore") => {
    if (!selected) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${endpoint}/api/admin/memories/${selected.id}`, { method: "POST", credentials: "include", body: adminForm({ action, moderationNote: note }) });
      if (!response.ok) throw new Error("সম্পাদনার সিদ্ধান্ত সংরক্ষণ করা যায়নি।");
      setMessage(action === "approve" ? "স্মৃতিটি অনুমোদন করে প্রকাশ করা হয়েছে।" : action === "reject" ? "স্মৃতিটি প্রত্যাখ্যান করে ব্যক্তিগত রাখা হয়েছে।" : "স্মৃতিটি আবার অপেক্ষমাণ তালিকায় রাখা হয়েছে।");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "সম্পাদনার সিদ্ধান্ত সংরক্ষণ করা যায়নি।"); }
    finally { setLoading(false); }
  };

  const saveEdit = async () => {
    if (!selected) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${endpoint}/api/admin/memories/${selected.id}`, { method: "POST", credentials: "include", body: adminForm({ ...edit, moderationNote: note }) });
      if (!response.ok) throw new Error("সম্পাদিত তথ্য সংরক্ষণ করা যায়নি।");
      setEditing(false); setMessage("সম্পাদিত তথ্য সংরক্ষণ করা হয়েছে এবং ইতিহাসে রাখা হয়েছে।"); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "সম্পাদিত তথ্য সংরক্ষণ করা যায়নি।"); }
    finally { setLoading(false); }
  };

  if (!endpoint) return <div className="notice">এই সংস্করণে সম্পাদকীয় API যুক্ত করা হয়নি।</div>;
  return <div className="moderation-dashboard">
    <div className="admin-grid"><div className="metric"><b>{counts.total}</b><span>{statusLabels[status as keyof typeof statusLabels]} স্মৃতি</span></div><div className="metric"><b>{counts.withPhotos}</b><span>ব্যক্তিগত ছবি-সহ জমা</span></div><div className="metric"><b>{loading ? "…" : "সক্রিয়"}</b><span>Cloudflare Access সেশন</span></div></div>
    {message && <div className="notice" role="status">{message}{message.includes("Cloudflare Access") && <>{" "}<a href={`${endpoint}/api/admin/memories?status=${status}`} target="_blank" rel="noreferrer">নিরাপদ সম্পাদকীয় সাইন-ইন খুলুন</a>। এরপর এখানে ফিরে এসে হালনাগাদ করুন।</>}</div>}
    <div className="moderation-toolbar">{(["pending", "approved", "rejected"] as const).map((item) => <button className={status === item ? "button button-accent" : "button moderation-tab"} key={item} onClick={() => setStatus(item)}>{statusLabels[item]}</button>)}<button className="button moderation-refresh" onClick={() => void load()}>হালনাগাদ</button></div>
    <div className="moderation-layout"><div className="moderation-list" aria-label="স্মৃতি জমা">{memories.length === 0 ? <p className="empty-copy">কোনো {statusLabels[status as keyof typeof statusLabels]} স্মৃতি নেই।</p> : memories.map((memory) => <button className={selected?.id === memory.id ? "moderation-item selected" : "moderation-item"} key={memory.id} onClick={() => { setSelected(memory); setNote(memory.moderation_note ?? ""); }}><strong>{memory.first_name} {memory.last_name}</strong><span>{memory.relationship_to_zea}</span><small>{new Date(memory.created_at).toLocaleDateString("bn-BD")}</small></button>)}</div>
      {selected ? <article className="moderation-detail"><div className="detail-meta"><span>{selected.relationship_to_zea}</span><span>{selected.email}</span></div>{editing ? <div className="form-stack"><label>প্রথম নাম<input value={edit.firstName} onChange={(event) => setEdit({ ...edit, firstName: event.target.value })} /></label><label>শেষ নাম<input value={edit.lastName} onChange={(event) => setEdit({ ...edit, lastName: event.target.value })} /></label><label>পরিচয়<input value={edit.relationship} onChange={(event) => setEdit({ ...edit, relationship: event.target.value })} /></label><label>গল্প<textarea value={edit.story} onChange={(event) => setEdit({ ...edit, story: event.target.value })} /></label><label>ছবির বিবরণ<input value={edit.photoCaption} onChange={(event) => setEdit({ ...edit, photoCaption: event.target.value })} /></label></div> : <><h3>{selected.first_name} {selected.last_name}</h3><p className="detail-story">{selected.story}</p></>}<p className="detail-meta">প্রকাশের অনুমতি: {selected.consent_to_publish ? "হ্যাঁ" : "না"} · যোগাযোগের অনুমতি: {selected.consent_to_contact ? "হ্যাঁ" : "না"}</p>{selected.photo_key && <img className="moderation-photo" src={`${endpoint}/api/admin/memories/${selected.id}/photo`} alt={selected.photo_caption || "জমা দেওয়া স্মৃতির ছবি"} />}<label className="form-stack"><span>সম্পাদকীয় নোট</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="ঐচ্ছিক অভ্যন্তরীণ নোট" /></label><div className="moderation-actions">{editing ? <><button className="button button-accent" disabled={loading} onClick={() => void saveEdit()}>তথ্য সংরক্ষণ করুন</button><button className="button moderation-tab" disabled={loading} onClick={() => setEditing(false)}>বাতিল</button></> : <button className="button moderation-tab" disabled={loading} onClick={() => setEditing(true)}>জমা সম্পাদনা করুন</button>}{!editing && status === "pending" && <><button className="button button-accent" disabled={loading} onClick={() => void decide("approve")}>অনুমোদন করে প্রকাশ করুন</button><button className="button button-danger" disabled={loading} onClick={() => void decide("reject")}>প্রত্যাখ্যান করুন</button></>}{!editing && status !== "pending" && <button className="button button-accent" disabled={loading} onClick={() => void decide("restore")}>আবার অপেক্ষমাণ করুন</button>}</div><div className="audit-history"><h4>সম্পাদনার ইতিহাস</h4>{auditEvents.length === 0 ? <p className="empty-copy">এখনো কোনো ঘটনা নেই।</p> : auditEvents.map((event) => <p key={event.id}><strong>{event.action === "approved" ? "প্রকাশিত" : event.action === "rejected" ? "প্রত্যাখ্যাত" : event.action === "pending" ? "অপেক্ষমাণ" : event.action === "edit" ? "সম্পাদিত" : event.action}</strong> · {event.actor_id ?? "সম্পাদক"} · {new Date(event.created_at).toLocaleString("bn-BD")}</p>)}</div></article> : <div className="admin-card empty-copy">পর্যালোচনার জন্য একটি জমা নির্বাচন করুন।</div>}
    </div>
  </div>;
}
