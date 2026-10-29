"use client";
import { useEffect, useState } from "react";
import { memoryApi } from "../lib/memory-client";
import { requestCategories } from "../lib/editorial-requests";
type Item = {
  id: string;
  category: keyof typeof requestCategories;
  article_url: string;
  email: string;
  message: string;
  created_at: string;
};
export function EditorialRequestQueue() {
  const [items, setItems] = useState<Item[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    try {
      const r = await fetch(`${memoryApi()}/api/editorial-requests/admin`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!r.ok)
        throw Error(
          r.status === 401
            ? "অনুরোধ দেখতে সম্পাদকের সাইন-ইন প্রয়োজন।"
            : "তালিকা খোলা যাচ্ছে না।",
        );
      const d = (await r.json()) as { requests: Item[] };
      setItems(d.requests);
      setMessage("");
    } catch (e) {
      setItems([]);
      setMessage(e instanceof Error ? e.message : "আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function resolve(id: string) {
    setBusy(true);
    try {
      const r = await fetch(
        `${memoryApi()}/api/editorial-requests/admin/${id}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resolve" }),
        },
      );
      if (!r.ok) throw Error("সিদ্ধান্ত সংরক্ষিত হয়নি।");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="editorial-request-queue">
      <h2>লেখা, অধিকার ও গোপনীয়তার অনুরোধ</h2>
      <p>
        শুধু মালিকের জন্য। প্রয়োজন হলে প্রদত্ত ইমেইলে আলাদাভাবে যোগাযোগ করুন;
        এখানে কোনো স্বয়ংক্রিয় ইমেইল পাঠানো হয় না।
      </p>
      <button className="button" disabled={busy} onClick={() => void load()}>
        তালিকা হালনাগাদ
      </button>
      {message && <p role="status">{message}</p>}
      {!message && !busy && !items.length && <p>কোনো অপেক্ষমাণ অনুরোধ নেই।</p>}
      {items.map((item) => (
        <article className="policy-private-request" key={item.id}>
          <h3>{requestCategories[item.category]}</h3>
          <p>
            জমার নম্বর: {item.id} · {item.created_at}
          </p>
          {item.article_url && <a href={item.article_url}>সংশ্লিষ্ট লেখা ↗</a>}
          <p>যোগাযোগ: {item.email}</p>
          <p className="memory-story-text">{item.message}</p>
          <button
            className="button"
            disabled={busy}
            onClick={() => void resolve(item.id)}
          >
            পর্যালোচনা শেষে নিষ্পন্ন করুন
          </button>
        </article>
      ))}
    </section>
  );
}
