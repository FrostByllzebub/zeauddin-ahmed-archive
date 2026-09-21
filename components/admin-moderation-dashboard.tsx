"use client";

import { useEffect, useMemo, useState } from "react";

type Memory = {
  id: string; first_name: string; last_name: string; email: string;
  relationship_to_zea: string; story: string; photo_key: string | null;
  photo_caption: string | null; consent_to_publish: number; consent_to_contact: number;
  moderation_status: string; moderation_note: string | null; created_at: string;
};
type AuditEvent = { id: number; action: string; actor_id: string | null; details: string | null; created_at: string };

const endpoint = process.env.NEXT_PUBLIC_MEMORY_API_URL ?? "";

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
    if (!endpoint) return setMessage("The editorial API is not configured for this build.");
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${endpoint}/api/admin/memories?status=${status}`, { credentials: "include", cache: "no-store" });
      if (response.status === 401) throw new Error("Cloudflare Access sign-in is required before opening the editorial queue.");
      if (!response.ok) throw new Error("The editorial queue could not be loaded.");
      const data = (await response.json()) as { memories: Memory[] };
      setMemories(data.memories);
      setSelected((current) => current && data.memories.some((item) => item.id === current.id) ? current : data.memories[0] ?? null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The editorial queue could not be loaded."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [status]);
  useEffect(() => {
    if (!selected || !endpoint) return;
    setEdit({ firstName: selected.first_name, lastName: selected.last_name, relationship: selected.relationship_to_zea, story: selected.story, photoCaption: selected.photo_caption ?? "" });
    setEditing(false);
    void fetch(`${endpoint}/api/admin/memories/${selected.id}/audit`, { credentials: "include", cache: "no-store" }).then((response) => response.ok ? response.json() : { events: [] }).then((data: { events: AuditEvent[] }) => setAuditEvents(data.events));
  }, [selected]);
  const counts = useMemo(() => ({ total: memories.length, withPhotos: memories.filter((item) => item.photo_key).length }), [memories]);

  const decide = async (action: "approve" | "reject" | "restore") => {
    if (!selected) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${endpoint}/api/admin/memories/${selected.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, moderationNote: note }) });
      if (!response.ok) throw new Error("The moderation decision could not be saved.");
      setMessage(action === "approve" ? "Memory approved and published." : action === "reject" ? "Memory rejected and kept private." : "Memory returned to the pending queue.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The moderation decision could not be saved."); }
    finally { setLoading(false); }
  };

  const saveEdit = async () => {
    if (!selected) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${endpoint}/api/admin/memories/${selected.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...edit, moderationNote: note }) });
      if (!response.ok) throw new Error("The edited memory could not be saved.");
      setEditing(false); setMessage("Edits saved and recorded in the audit history."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The edited memory could not be saved."); }
    finally { setLoading(false); }
  };

  if (!endpoint) return <div className="notice">The editorial API is not configured for this build.</div>;
  return <div className="moderation-dashboard">
    <div className="admin-grid"><div className="metric"><b>{counts.total}</b><span>{status} submissions</span></div><div className="metric"><b>{counts.withPhotos}</b><span>submissions with private photos</span></div><div className="metric"><b>{loading ? "…" : "Live"}</b><span>Cloudflare Access session</span></div></div>
    {message && <div className="notice" role="status">{message}</div>}
    <div className="moderation-toolbar">{(["pending", "approved", "rejected"] as const).map((item) => <button className={status === item ? "button button-accent" : "button moderation-tab"} key={item} onClick={() => setStatus(item)}>{item}</button>)}<button className="button moderation-refresh" onClick={() => void load()}>Refresh</button></div>
    <div className="moderation-layout"><div className="moderation-list" aria-label="Memory submissions">{memories.length === 0 ? <p className="empty-copy">No {status} submissions.</p> : memories.map((memory) => <button className={selected?.id === memory.id ? "moderation-item selected" : "moderation-item"} key={memory.id} onClick={() => { setSelected(memory); setNote(memory.moderation_note ?? ""); }}><strong>{memory.first_name} {memory.last_name}</strong><span>{memory.relationship_to_zea}</span><small>{new Date(memory.created_at).toLocaleDateString("en-CA")}</small></button>)}</div>
      {selected ? <article className="moderation-detail"><div className="detail-meta"><span>{selected.relationship_to_zea}</span><span>{selected.email}</span></div>{editing ? <div className="form-stack"><label>First name<input value={edit.firstName} onChange={(event) => setEdit({ ...edit, firstName: event.target.value })} /></label><label>Last name<input value={edit.lastName} onChange={(event) => setEdit({ ...edit, lastName: event.target.value })} /></label><label>Relationship<input value={edit.relationship} onChange={(event) => setEdit({ ...edit, relationship: event.target.value })} /></label><label>Story<textarea value={edit.story} onChange={(event) => setEdit({ ...edit, story: event.target.value })} /></label><label>Photo caption<input value={edit.photoCaption} onChange={(event) => setEdit({ ...edit, photoCaption: event.target.value })} /></label></div> : <><h3>{selected.first_name} {selected.last_name}</h3><p className="detail-story">{selected.story}</p></>}<p className="detail-meta">Publication consent: {selected.consent_to_publish ? "yes" : "no"} · Contact consent: {selected.consent_to_contact ? "yes" : "no"}</p>{selected.photo_key && <img className="moderation-photo" src={`${endpoint}/api/admin/memories/${selected.id}/photo`} alt={selected.photo_caption || "Submitted memory photograph"} />}<label className="form-stack"><span>Editorial note</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional internal note" /></label><div className="moderation-actions">{editing ? <><button className="button button-accent" disabled={loading} onClick={() => void saveEdit()}>Save edits</button><button className="button moderation-tab" disabled={loading} onClick={() => setEditing(false)}>Cancel</button></> : <button className="button moderation-tab" disabled={loading} onClick={() => setEditing(true)}>Edit submission</button>}{!editing && status === "pending" && <><button className="button button-accent" disabled={loading} onClick={() => void decide("approve")}>Approve &amp; publish</button><button className="button button-danger" disabled={loading} onClick={() => void decide("reject")}>Reject</button></>}{!editing && status !== "pending" && <button className="button button-accent" disabled={loading} onClick={() => void decide("restore")}>Return to pending</button>}</div><div className="audit-history"><h4>Audit history</h4>{auditEvents.length === 0 ? <p className="empty-copy">No events yet.</p> : auditEvents.map((event) => <p key={event.id}><strong>{event.action}</strong> · {event.actor_id ?? "editor"} · {new Date(event.created_at).toLocaleString("en-CA")}</p>)}</div></article> : <div className="admin-card empty-copy">Select a submission to review.</div>}
    </div>
  </div>;
}
