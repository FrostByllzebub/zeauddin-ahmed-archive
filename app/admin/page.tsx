import SiteBrand from "../../components/site-brand";
import { AdminModerationDashboard } from "../../components/admin-moderation-dashboard";
export default function AdminPage() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <SiteBrand />
        <a className="header-action" href="/memories">
          স্মৃতির খাতা ↗
        </a>
      </header>
      <section className="memory-admin-page">
        <p className="eyebrow">সম্পাদকীয় কর্মক্ষেত্র</p>
        <h1>স্মৃতির পর্যালোচনা</h1>
        <p>
          অপেক্ষমাণ → পর্যালোচিত → প্রকাশিত। প্রতিটি সিদ্ধান্ত ব্যক্তিগত ইতিহাসে
          সংরক্ষিত থাকবে।
        </p>
        <AdminModerationDashboard />
      </section>
      <footer className="site-footer">
        <span>জিয়ার দৃষ্টিতে</span>
        <a href="/policies#memory-privacy">গোপনীয়তা ও প্রকাশের নীতি</a>
      </footer>
    </main>
  );
}
