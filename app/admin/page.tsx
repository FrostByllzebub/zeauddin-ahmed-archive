import Link from "next/link";
import { AdminModerationDashboard } from "../../components/admin-moderation-dashboard";

export default function AdminPage() {
  return <main className="site-shell"><header className="site-header"><Link className="brand" href="/"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></Link><Link className="header-action" href="/">পাবলিক সাইট <span>↗</span></Link></header><section className="page-wrap"><div className="page-heading"><p className="eyebrow">সম্পাদকীয় workspace</p><h1>ব্যক্তিগত<br /><em>সম্পাদকীয় কাজ</em></h1><p>শুধু অনুমোদিত সম্পাদক Cloudflare Access দিয়ে প্রবেশ করবেন। এখানে pending স্মৃতি পর্যালোচনা, ব্যক্তিগত যোগাযোগের তথ্য দেখা, ছবি যাচাই এবং প্রকাশনা-সিদ্ধান্ত নেওয়া যায়।</p></div><AdminModerationDashboard /></section><footer className="site-footer"><span>প্রকাশিত তথ্যের archive</span><span><Link href="/policies">নীতি ও যোগাযোগ</Link></span></footer></main>;
}
