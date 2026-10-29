"use client";
import { useEffect, useState } from "react";
import { memoryApi } from "../lib/memory-client";
type Memory = {
  id: string;
  title: string;
  story: string;
  displayName: string;
  relationship: string;
  photoUrl: string | null;
  photoCaption: string | null;
  photoDate: string | null;
  publishedAt: string;
};
export function MemoryCollection() {
  const [items, setItems] = useState<Memory[]>([]),
    [state, setState] = useState("loading"),
    [open, setOpen] = useState<string | null>(null),
    [limit, setLimit] = useState(6);
  function load() {
    setState("loading");
    fetch(`${memoryApi()}/api/memories`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw Error();
        const data = (await r.json()) as { memories: Memory[] };
        setItems(data.memories);
        setState("ready");
      })
      .catch(() => setState("error"));
  }
  useEffect(() => {
    load();
    window.addEventListener("memories-updated", load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("memories-updated", load);
      window.removeEventListener("focus", load);
    };
  }, []);
  return (
    <section
      className="memory-collection"
      id="shared-memories"
      aria-labelledby="shared-title"
    >
      <div className="memory-section-head">
        <div>
          <h2 id="shared-title">ভাগ করে নেওয়া স্মৃতি</h2>
        </div>
        <a className="text-link" href="#write-memory">
          আপনিও লিখুন ↗
        </a>
      </div>
      {state === "loading" ? (
        <p role="status" className="memory-empty">
          স্মৃতিগুলো খোলা হচ্ছে…
        </p>
      ) : state === "error" ? (
        <div className="memory-empty">
          <p>এই মুহূর্তে স্মৃতিগুলো খোলা যাচ্ছে না।</p>
          <button className="button" onClick={load}>
            আবার চেষ্টা করুন
          </button>
        </div>
      ) : !items.length ? (
        <div className="memory-empty">
          <span className="memory-empty-rule" aria-hidden="true" />
          <h3>এই খাতায় আপনার গল্পের অপেক্ষা</h3>
          <p>
            পর্যালোচনা ও অনুমতি সম্পন্ন হলে স্মৃতিগুলো এখানে প্রকাশিত হবে।
            পরিচয়ের একটি মুহূর্ত দিয়েই শুরু করতে পারেন।
          </p>
          <a className="text-link" href="#write-memory">
            প্রথম স্মৃতিটি লিখুন →
          </a>
        </div>
      ) : (
        <>
          <div className="memory-card-grid">
            {items.slice(0, limit).map((m) => (
              <article className="memory-story-card" key={m.id}>
                {m.photoUrl && (
                  <figure>
                    <img
                      src={`${memoryApi()}${m.photoUrl}`}
                      alt={m.photoCaption || "স্মৃতির সঙ্গে প্রকাশিত ছবি"}
                      loading="lazy"
                    />
                    <figcaption>
                      {m.photoCaption}
                      {m.photoDate && ` · ${m.photoDate}`}
                    </figcaption>
                  </figure>
                )}
                <p className="memory-story-meta">{m.relationship}</p>
                <h3>{m.title}</h3>
                <p className="memory-byline">{m.displayName}</p>
                <div className="memory-story-text">
                  {open === m.id ? (
                    m.story.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)
                  ) : (
                    <p>
                      {m.story.length > 230
                        ? m.story.slice(0, 230) + "…"
                        : m.story}
                    </p>
                  )}
                </div>
                {m.story.length > 230 && (
                  <button
                    className="memory-read-more"
                    aria-expanded={open === m.id}
                    onClick={() => setOpen(open === m.id ? null : m.id)}
                  >
                    {open === m.id ? "সংক্ষেপে দেখুন ↑" : "পুরো স্মৃতি পড়ুন →"}
                  </button>
                )}
                <small>
                  প্রকাশ:{" "}
                  {new Date(m.publishedAt).toLocaleDateString("bn-BD", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </small>
              </article>
            ))}
          </div>
          {limit < items.length && (
            <button className="button" onClick={() => setLimit(limit + 6)}>
              আরও স্মৃতি পড়ুন
            </button>
          )}
        </>
      )}
    </section>
  );
}
