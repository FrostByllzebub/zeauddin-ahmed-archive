import Link from "next/link";

const nav = [["আর্কাইভ", "/archive"], ["প্রকাশনা", "/publications"], ["পরিচিতি", "/about"]];

export default function Home() {
  return <main className="site-shell">
    <header className="site-header">
      <Link className="brand" href="/" aria-label="জিয়ার কলাম আর্কাইভ — হোম"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></Link>
      <nav aria-label="প্রধান নেভিগেশন">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      <Link className="header-action" href="/archive">লেখা খুঁজুন <span>↗</span></Link>
    </header>
    <section className="home-grid">
      <div className="home-intro"><p className="eyebrow">ডিজিটাল সংগ্রহ · ২০২৬</p><h1>জিয়ার প্রকাশিত<br /><em>লেখার স্মৃতি</em></h1><p className="lede">প্রকাশিত কলাম ও প্রবন্ধের একটি যাচাইকৃত, অধিকার-সচেতন বাংলা আর্কাইভ। উৎস হাতে এলে প্রতিটি লেখা সংরক্ষণ, যাচাই ও পড়ার জন্য সাজানো হবে।</p><div className="home-actions"><Link className="button button-accent" href="/archive">আর্কাইভ দেখুন <span>→</span></Link><Link className="text-link" href="/about">জিয়া সম্পর্কে জানুন</Link></div></div>
      <aside className="archive-status" aria-label="আর্কাইভের অবস্থা"><div className="status-rule" /><p className="eyebrow">সংগ্রহের অবস্থা</p><div className="status-number">০</div><h2>যাচাইকৃত লেখা</h2><p>এই আর্কাইভে এখনো কোনো উৎস-নথি যোগ করা হয়নি। তাই এখানে অনুমানভিত্তিক শিরোনাম, তারিখ বা জীবনী নেই।</p><Link className="text-link" href="/archive">খালি আর্কাইভ দেখুন ↗</Link></aside>
    </section>
    <section className="home-lower"><div><p className="eyebrow">আর্কাইভের নীতি</p><h2>প্রতিটি লেখা<br /><em>উৎসসহ</em></h2></div><div className="principles"><div><span>০১</span><p>প্রকাশনার নাম, তারিখ ও মূল লিংক সংরক্ষণ</p></div><div><span>০২</span><p>অনুমতি না থাকলে পূর্ণ লেখা নয়—শুধু অনুমোদিত অংশ</p></div><div><span>০৩</span><p>সম্পাদনার প্রতিটি পরিবর্তনের জন্য ইতিহাস রাখা</p></div></div></section>
    <footer className="site-footer"><span>জিয়ার কলাম আর্কাইভ</span><span>© ২০২৬ · <Link href="/policies">নীতি ও যোগাযোগ</Link></span></footer>
  </main>;
}
