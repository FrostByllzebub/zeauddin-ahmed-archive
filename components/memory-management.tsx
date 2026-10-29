"use client";
import { useState } from "react";
import { memoryApi, memoryStatus } from "../lib/memory-client";
export function MemoryManagement() {
  const [id, setId] = useState(""),
    [code, setCode] = useState(""),
    [text, setText] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  async function act(action: string) {
    if (busy) return;
    if (!id.trim() || !code.trim()) {
      setMessage("জমার নম্বর ও গোপন কোড দিন।");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch(`${memoryApi()}/api/memories/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id.trim(),
          code: code.trim(),
          action,
          message: text,
        }),
      });
      const data = (await r.json()) as {
        error?: string;
        status?: string;
        message?: string;
      };
      if (!r.ok) throw Error(data.error || "কাজটি করা যায়নি।");
      if (data.status) setStatus(data.status);
      if (action === "withdraw")
        window.dispatchEvent(new Event("memories-updated"));
      setMessage(
        data.message ||
          `বর্তমান অবস্থা: ${memoryStatus[data.status || ""] || data.status}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "সংযোগ পাওয়া যাচ্ছে না। পরে চেষ্টা করুন।",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="memory-management"
      id="manage-memory"
      aria-labelledby="manage-title"
    >
      <details>
        <summary id="manage-title">
          আগের জমার অবস্থা, সংশোধন বা প্রত্যাহার
        </summary>
        <p>
          জমার পরে পাওয়া রসিদের নম্বর ও গোপন কোড দিন। কোড ছাড়া অন্য কেউ আপনার
          জমা পরিচালনা করতে পারবেন না। প্রত্যাহার করলে গল্প ও ছবি আর প্রকাশ্যে
          দেখা যাবে না; সম্পাদকীয় রেকর্ড ব্যক্তিগত থাকবে।
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act("status");
          }}
          className="memory-form"
        >
          <div className="memory-fields-two">
            <label className="memory-field">
              জমার নম্বর
              <input
                autoComplete="off"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                maxLength={36}
              />
            </label>
            <label className="memory-field">
              গোপন কোড
              <input
                type="password"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={64}
              />
            </label>
          </div>
          <button className="button" disabled={busy}>
            অবস্থা দেখুন
          </button>
          <label className="memory-field">
            সংশোধনের বিবরণ
            <textarea
              rows={3}
              minLength={10}
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="কোন অংশটি কীভাবে সংশোধন করতে চান?"
            />
          </label>
          <button
            className="button"
            type="button"
            disabled={busy || text.trim().length < 10}
            onClick={() => void act("correct")}
          >
            সংশোধনের অনুরোধ পাঠান
          </button>
          {status && status !== "withdrawn" && (
            <details className="memory-withdraw">
              <summary>প্রকাশ থেকে প্রত্যাহার করতে চাই</summary>
              <p>
                নিশ্চিত করলে আপনার গল্প ও ছবি সঙ্গে সঙ্গে প্রকাশ থেকে সরিয়ে
                নেওয়া হবে।
              </p>
              <button
                type="button"
                className="button button-danger"
                disabled={busy}
                onClick={() => void act("withdraw")}
              >
                প্রত্যাহার নিশ্চিত করুন
              </button>
            </details>
          )}
          <p role="status">{busy ? "সংরক্ষণ করা হচ্ছে…" : message}</p>
        </form>
        <p className="memory-private-note">
          কোড হারিয়ে গেলে নতুন অনুরোধের গল্পে আগের জমার নম্বর লিখুন এবং একই
          ইমেইল ব্যবহার করুন। সম্পাদক পরিচয় যাচাই করে সহায়তা করবেন; অনুরোধে গোপন
          কোড লিখবেন না।
        </p>
      </details>
    </section>
  );
}
