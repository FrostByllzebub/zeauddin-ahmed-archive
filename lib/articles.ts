export type ArchiveArticle = {
  slug: string;
  title: string;
  author: string;
  publication: string;
  section: string;
  publishedAt: string;
  publishedDateLabel: string;
  originalUrl: string;
  rightsStatus: "excerpt_only" | "full_text_permitted" | "metadata_only";
  summary: string;
  excerpt: string;
  sourceNote: string;
};

export const articles: ArchiveArticle[] = [
  {
    slug: "brics-sommelon-o-bangladesher-koutnoitik-hisab",
    title: "ব্রিকস সম্মেলন ও বাংলাদেশের কূটনৈতিক হিসাব",
    author: "জিয়াউদ্দীন আহমেদ",
    publication: "সংবাদ",
    section: "মতামত",
    publishedAt: "২০২৬-০৯-১৯",
    publishedDateLabel: "১৯ সেপ্টেম্বর ২০২৬",
    originalUrl: "https://sangbad.net/news/18013/",
    rightsStatus: "excerpt_only",
    summary: "১৮তম ব্রিকস সম্মেলনে বাংলাদেশের অনুপস্থিতির কূটনৈতিক প্রভাব, ভারত-বাংলাদেশ সম্পর্কের বর্তমান টানাপোড়েন এবং প্রতিবেশী রাষ্ট্রের সঙ্গে বাস্তব স্বার্থে সংলাপ চালু রাখার প্রয়োজনীয়তা নিয়ে লেখকের বিশ্লেষণ।",
    excerpt: "বাংলাদেশের এখন প্রয়োজন আবেগ নয়, হিসাবি কূটনীতি—যেখানে প্রতিবাদ থাকবে, কিন্তু দরজা বন্ধ হবে না।",
    sourceNote: "মূল প্রকাশনায় লেখাটি মতামত হিসেবে প্রকাশিত হয়েছে। পূর্ণ পাঠ ও মূল বিন্যাসের জন্য মূল প্রকাশনার পাতাটি দেখুন।",
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
