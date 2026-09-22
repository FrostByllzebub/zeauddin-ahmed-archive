import Link from "next/link";
import { AdminModerationDashboard } from "../../components/admin-moderation-dashboard";

export default function AdminPage() {
  return <main className="site-shell"><header className="site-header"><Link className="brand" href="/"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></Link><Link className="header-action" href="/">পাবলিক সাইট <span>↗</span></Link></header><section className="page-wrap"><div className="page-heading"><p className="eyebrow">সম্পাদকীয় কর্মক্ষেত্র</p><h1>ব্যক্তিগত<br /><em>সম্পাদকীয় কাজ</em></h1><p>শুধু অনুমোদিত সম্পাদকই Cloudflare Access-এর মাধ্যমে এখানে প্রবেশ করতে পারবেন। এখানে অপেক্ষমাণ স্মৃতি পর্যালোচনা, ব্যক্তিগত যোগাযোগের তথ্য দেখা, ছবির অনুমতি যাচাই এবং প্রকাশের সিদ্ধান্ত নেওয়া হয়।</p></div><AdminModerationDashboard /></section><footer className="site-footer"><span>প্রকাশিত তথ্যের আর্কাইভ</span><span><Link href="/policies">নীতি ও যোগাযোগ</Link></span></footer></main>;
}
