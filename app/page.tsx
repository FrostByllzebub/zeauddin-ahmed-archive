import Link from "next/link";
import { articles } from "../lib/articles";

const nav = [["আর্কাইভ", "/archive"], ["স্মৃতির খাতা", "/memories"], ["পরিচিতি", "/about"]];

export default function Home() {
  return <main className="site-shell">
    <header className="site-header">
      <Link className="brand" href="/" aria-label="জিয়ার কলাম আর্কাইভ — হোম"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></Link>
      <nav aria-label="প্রধান নেভিগেশন">{nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <a className="header-action" href="/archive">লেখা খুঁজুন <span>↗</span></a>
    </header>
    <section className="home-grid">
      <div className="home-intro"><p className="eyebrow">ডিজিটাল সংগ্রহ · ২০২৬</p><h1>জিয়াউদ্দীন আহমেদের<br /><em>লেখার আর্কাইভ</em></h1><p className="lede">জিয়াউদ্দীন আহমেদের প্রকাশিত কলাম ও প্রবন্ধের একটি যাচাইকৃত, অধিকার-সচেতন বাংলা আর্কাইভ। উৎস হাতে এলে প্রতিটি লেখা সংরক্ষণ, যাচাই ও পাঠের জন্য সাজানো হবে।</p><div className="home-actions"><a className="button button-accent" href="/archive">আর্কাইভ দেখুন <span>→</span></a><a className="text-link" href="/about">জিয়াউদ্দীন আহমেদ সম্পর্কে জানুন</a></div></div>
      <aside className="archive-status" aria-label="আর্কাইভের অবস্থা"><div className="status-rule" /><p className="eyebrow">সংগ্রহের অবস্থা</p><div className="status-number">{articles.length.toLocaleString("bn-BD")}</div><h2>সংরক্ষিত লেখা</h2><p>উৎস, প্রকাশনার তারিখ ও পাঠযোগ্যতার তথ্যসহ লেখাগুলো এখানে সাজানো হয়েছে। নতুন লেখা যাচাই হলে এই সংগ্রহে যুক্ত হবে।</p><a className="text-link" href="/archive">আর্কাইভ দেখুন ↗</a></aside>
    </section>
    <section className="home-lower"><div><p className="eyebrow">আর্কাইভের নীতি</p><h2>প্রতিটি লেখা<br /><em>উৎসসহ</em></h2></div><div className="principles"><div><span>০১</span><p>প্রকাশনার নাম, তারিখ ও মূল লিংক সংরক্ষণ</p></div><div><span>০২</span><p>অনুমতি না থাকলে পূর্ণ লেখা নয়—শুধু অনুমোদিত অংশ</p></div><div><span>০৩</span><p>সম্পাদনার প্রতিটি পরিবর্তনের জন্য ইতিহাস রাখা</p></div></div></section>
    <footer className="site-footer"><span>জিয়ার কলাম আর্কাইভ</span><span>© ২০২৬ · <a href="/policies">নীতি ও যোগাযোগ</a></span></footer>
  </main>;
}
