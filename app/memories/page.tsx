import SiteBrand from "../../components/site-brand";
import Link from "../../components/safe-link";
import { MemorySubmissionForm } from "../../components/memory-submission-form";
import { MemoryCollection } from "../../components/memory-collection";
import { MemoryManagement } from "../../components/memory-management";
export default function MemoriesPage() {
  return (
    <main className="site-shell memories-page">
      <header className="site-header">
        <SiteBrand />
        <nav aria-label="প্রধান নেভিগেশন">
          <Link href="/archive">আর্কাইভ</Link>
          <Link href="/memories" aria-current="page">
            স্মৃতির খাতা
          </Link>
          <Link href="/about">পরিচিতি</Link>
        </nav>
        <Link className="header-action" href="/">
          হোম ↗
        </Link>
      </header>
      <section className="memories-hero" aria-labelledby="memories-title">
        <div>
          <p className="eyebrow">মানুষ, সম্পর্ক ও মনে থাকা মুহূর্ত</p>
          <h1 id="memories-title">
            স্মৃতির <em>খাতা</em>
          </h1>
          <p className="memories-opening">
            কিছু মানুষকে চেনা যায় অন্যের স্মৃতিতে।
          </p>
          <p className="memories-description">
            জিয়াউদ্দীন আহমেদের সঙ্গে পরিচয়, একসঙ্গে কাজ করার অভিজ্ঞতা কিংবা মনে
            থেকে যাওয়া কোনো মুহূর্ত—আপনার গল্পে সমৃদ্ধ হোক এই স্মৃতির খাতা।
          </p>
          <div className="memory-button-row">
            <a className="button button-accent" href="#write-memory">
              আপনার স্মৃতি লিখুন →
            </a>
            <a className="text-link" href="#shared-memories">
              স্মৃতিগুলো পড়ুন ↓
            </a>
          </div>
        </div>
        <aside className="memory-invitation">
          <span aria-hidden="true">“</span>
          <p>
            একটি ছোট ঘটনা।
            <br />
            একটি আলাপ।
            <br />
            মানুষটিকে চেনার আরেকটি জানালা।
          </p>
          <small>বন্ধু, পরিবার, সহকর্মী ও পাঠকের অভিজ্ঞতার সংগ্রহ</small>
        </aside>
      </section>
      <MemoryCollection />
      <section
        className="memory-writing"
        id="write-memory"
        aria-labelledby="write-title"
      >
        <aside className="memory-writing-intro">
          <p className="eyebrow">আপনার কথায়</p>
          <h2 id="write-title">
            একটি মুহূর্ত
            <br />
            <em>দিয়ে শুরু করুন</em>
          </h2>
          <p>
            বড় লেখা প্রয়োজন নেই। আপনার নিজের দেখা কোনো ঘটনা বা অভিজ্ঞতাই
            মূল্যবান।
          </p>
          <ul>
            <li>প্রথম পরিচয়ের কথা মনে আছে?</li>
            <li>একসঙ্গে কাজ করার কোনো অভিজ্ঞতা?</li>
            <li>তাঁর কোনো কথা বা লেখা মনে রয়ে গেছে?</li>
          </ul>
          <div className="memory-process">
            <h3>জমার পর কী হয়?</h3>
            <ol>
              <li>আপনার জমা ব্যক্তিগতভাবে সংরক্ষিত হয়।</li>
              <li>সম্পাদক গল্প, অনুমতি ও ছবি পর্যালোচনা করেন।</li>
              <li>অনুমোদিত স্মৃতি আপনার বেছে নেওয়া পরিচয়ে প্রকাশিত হয়।</li>
            </ol>
          </div>
          <p className="memory-private-note">
            ব্যক্তিগত যোগাযোগের তথ্য প্রকাশিত হবে না।{" "}
            <a href="/policies#memory-privacy">গোপনীয়তা ও প্রকাশের নীতি ↗</a>
          </p>
        </aside>
        <div className="memory-form-panel">
          <h3>আপনার গল্প</h3>
          <MemorySubmissionForm />
        </div>
      </section>
      <MemoryManagement />
      <footer className="site-footer">
        <span>জিয়ার দৃষ্টিতে</span>
        <span>
          <Link href="/policies">গোপনীয়তা ও নীতি</Link> ·{" "}
          <Link href="/admin">সম্পাদকীয় কর্মক্ষেত্র</Link>
        </span>
      </footer>
    </main>
  );
}
