"use client";

import { useState } from "react";
import type { FormEvent } from "react";

const endpoint = process.env.NEXT_PUBLIC_MEMORY_API_URL ?? "";

export function MemorySubmissionForm() {
  const [status, setStatus] = useState("");
  const configured = Boolean(endpoint);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;
    setStatus("জমা দেওয়া হচ্ছে…");
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("consentToPublish", data.get("consentToPublish") === "on" ? "true" : "false");
    data.set("consentToContact", data.get("consentToContact") === "on" ? "true" : "false");
    try {
      const response = await fetch(`${endpoint.replace(/\/$/, "")}/api/memories`, { method: "POST", body: data });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "জমা দেওয়া যায়নি");
      form.reset();
      setStatus(result.message ?? "আপনার স্মৃতি পর্যালোচনার জন্য জমা হয়েছে।");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "এই মুহূর্তে জমা দেওয়া যাচ্ছে না।");
    }
  }

  return <form className="form-stack" aria-label="স্মৃতি জমাদান" onSubmit={submit}>
    <label>প্রথম নাম<input name="firstName" placeholder="আপনার প্রথম নাম" required disabled={!configured} /></label>
    <label>শেষ নাম<input name="lastName" placeholder="আপনার শেষ নাম" required disabled={!configured} /></label>
    <label>জিয়াউদ্দীন আহমেদের সঙ্গে আপনার পরিচয়<select name="relationship" required disabled={!configured} defaultValue=""><option value="" disabled>একটি পরিচয় বেছে নিন</option><option>পরিবারের সদস্য</option><option>বন্ধু</option><option>সহকর্মী</option><option>ছাত্র বা সহপাঠী</option><option>পাঠক</option><option>অন্যভাবে পরিচিত</option></select></label>
    <label>আপনার ইমেইল<input name="email" type="email" placeholder="শুধু যোগাযোগের জন্য" required disabled={!configured} /></label>
    <label>আপনার স্মৃতি বা গল্প<textarea name="story" placeholder="যা শেয়ার করতে চান…" minLength={20} maxLength={6000} required disabled={!configured} /></label>
    <label>একটি ছবি (ঐচ্ছিক)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={!configured} /><span className="field-note">JPG, PNG বা WebP · সর্বোচ্চ ৫ MB · ছবি প্রকাশের অধিকার আপনার থাকতে হবে</span></label>
    <label>ছবির বিবরণ (ঐচ্ছিক)<input name="photoCaption" placeholder="ছবিতে কারা আছেন, আনুমানিক সময়…" maxLength={500} disabled={!configured} /></label>
    <label className="honeypot" aria-hidden="true" style={{ display: "none" }}>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <div className="form-consent"><label><input name="consentToPublish" type="checkbox" required disabled={!configured} /> প্রকাশের জন্য আমার গল্প/ছবি বিবেচনা করা যেতে পারে</label><label><input name="consentToContact" type="checkbox" disabled={!configured} /> ভবিষ্যতে এই জমাদান নিয়ে যোগাযোগ করা যেতে পারে</label></div>
    <button className="button button-accent" type="submit" disabled={!configured}>{configured ? "স্মৃতি জমা দিন" : "স্মৃতি জমাদান শিগগিরই"}</button>
    <p className="form-status" role="status">{status}</p>
  </form>;
}
