import SiteBrand from "../../components/site-brand";
import Link from "../../components/safe-link";

export default function PublicationsPage() {
  return <main className="site-shell"><header className="site-header"><SiteBrand /><nav aria-label="প্রধান নেভিগেশন"><Link href="/archive">আর্কাইভ</Link><Link href="/publications">প্রকাশনা</Link><Link href="/about">পরিচিতি</Link></nav><Link className="header-action" href="/archive">লেখা খুঁজুন <span aria-hidden="true">↗</span></Link></header><section className="page-wrap"><div className="page-heading"><p className="eyebrow">প্রকাশনা সূচি</p><h1>কোথায় প্রকাশিত<br /><em>হয়েছে</em></h1><p>যাচাইকৃত প্রকাশনাগুলো সময়ের ক্রমে এখানে সাজানো হবে। কোনো তথ্য অনুমান করে যোগ করা হয়নি।</p></div><div className="empty-panel"><div className="empty-stamp" aria-hidden="true">—</div><div><h2>প্রকাশনা তালিকা প্রস্তুত হচ্ছে</h2><p>প্রথম উৎস-নথি যাচাই হলে প্রকাশনার নাম, লেখার সংখ্যা ও সময়সীমা এখানে দেখা যাবে।</p></div></div></section><footer className="site-footer"><span>জিয়ার দৃষ্টিতে</span><span><Link href="/policies">কপিরাইট ও যোগাযোগ</Link></span></footer></main>;
}
