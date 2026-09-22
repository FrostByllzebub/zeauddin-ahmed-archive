import Link from "next/link";
import { MemorySubmissionForm } from "../../components/memory-submission-form";

export default function MemoriesPage() {
  return <main className="site-shell">
    <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></Link><nav aria-label="প্রধান নেভিগেশন"><Link href="/archive">আর্কাইভ</Link><Link href="/memories">স্মৃতির খাতা</Link><Link href="/about">পরিচিতি</Link></nav><Link className="header-action" href="/">হোম <span>↗</span></Link></header>
    <section className="page-wrap">
      <div className="page-heading"><p className="eyebrow">স্মৃতির খাতা · ব্যক্তিগত গল্প</p><h1>জিয়াউদ্দীন আহমেদকে নিয়ে<br /><em>আপনার স্মৃতি</em></h1><p>জিয়াউদ্দীন আহমেদকে যারা চেনেন, তাঁদের স্মৃতি, গল্প ও ছবির জন্য এই খাতা। তিনি জীবিত থাকতেই তাঁর কাজ, মানুষ ও সময়কে ঘিরে এই স্মৃতিগুলো সংরক্ষণ করা হচ্ছে।</p></div>
      <div className="memory-layout content-columns">
        <div className="memory-intro"><div className="memory-seal">স্মৃতি<br />সংগ্রহ</div><h2>কী শেয়ার করতে পারেন</h2><ul><li>কখন বা কীভাবে জিয়াউদ্দীন আহমেদের সঙ্গে আপনার পরিচয়</li><li>মনে থাকা কোনো ঘটনা, অভিজ্ঞতা বা ছোট গল্প</li><li>তাঁর কাজ বা ব্যক্তিত্বের আপনার দেখা কোনো দিক</li><li>একসঙ্গে থাকা কোনো ছবি, যদি সেটি শেয়ার করার অধিকার আপনার থাকে</li></ul><div className="notice">আপনার নাম ও ইমেইল যোগাযোগের জন্য ব্যক্তিগত থাকবে। গল্প বা ছবি প্রকাশের আগে সম্পাদকীয় পর্যালোচনা এবং আপনার অনুমতি প্রয়োজন হবে।</div></div>
        <div className="admin-card memory-form-card"><p className="eyebrow">স্মৃতি জমা দিন</p><h2>আপনার গল্প</h2><p>নাম, ইমেইল ও ছবি ব্যক্তিগতভাবে রাখা হবে। প্রকাশের আগে প্রতিটি জমা পর্যালোচনা করা হবে।</p><MemorySubmissionForm /></div>
      </div>
    </section>
    <footer className="site-footer"><span>জিয়ার কলাম আর্কাইভ</span><span><Link href="/policies">গোপনীয়তা ও নীতি</Link></span></footer>
  </main>;
}
