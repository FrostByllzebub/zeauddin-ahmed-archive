"use client";

import { useEffect, useState } from "react";

type ArticleReadingToolsProps = { title: string };

export default function ArticleReadingTools({ title }: ArticleReadingToolsProps) {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 100);
      setShowTop(window.scrollY > 520);
    };
    update(); window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  const announce = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(""), 2200); };
  const copyArticle = async () => {
    const article = document.querySelector(".article-body"); if (!article) return;
    try { await navigator.clipboard.writeText(`${title}\n\n${article.textContent?.trim() ?? ""}`); announce("লেখাটি কপি হয়েছে"); }
    catch { announce("কপি করা সম্ভব হয়নি"); }
  };
  const shareArticle = async () => {
    try { if (navigator.share) await navigator.share({ title, text: title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); announce("লিংক কপি হয়েছে"); } }
    catch { /* A dismissed share dialog needs no feedback. */ }
  };
  return <>
    <div className="reading-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
    <div className="article-tools" aria-label="লেখা ব্যবহারের সরঞ্জাম">
      <button type="button" onClick={() => window.print()}>প্রিন্ট</button><button type="button" onClick={() => void copyArticle()}>কপি</button><button type="button" onClick={() => void shareArticle()}>শেয়ার</button>
    </div>
    <p className="sr-only" role="status" aria-live="polite">{message}</p>
    {showTop && <button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="পাতার ওপরে ফিরে যান">ওপরে ↑</button>}
  </>;
}
