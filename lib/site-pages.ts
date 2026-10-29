export const siteOrigin = 'https://zeauddinahmed.com';
export const sitePages = [
  { path: '/', title: 'জিয়ার দৃষ্টিতে — সমাজ, সময় ও মানুষের কথা', description: 'জিয়াউদ্দীন আহমেদের প্রকাশিত বাংলা কলাম ও প্রবন্ধের যাচাইকৃত ডিজিটাল আর্কাইভ।' },
  { path: '/archive', title: 'লেখার আর্কাইভ | জিয়ার দৃষ্টিতে', description: 'বিষয়, প্রকাশনা ও বছর অনুযায়ী জিয়াউদ্দীন আহমেদের বাংলা কলাম খুঁজুন।' },
  { path: '/memories', title: 'স্মৃতির খাতা | জিয়ার দৃষ্টিতে', description: 'জিয়াউদ্দীন আহমেদকে নিয়ে স্মৃতি, গল্প ও ছবি সংরক্ষণের উদ্যোগ।' },
  { path: '/about', title: 'লেখক পরিচিতি | জিয়ার দৃষ্টিতে', description: 'বাংলা কলাম লেখক জিয়াউদ্দীন আহমেদের পরিচিতি ও আর্কাইভ সম্পর্কে তথ্য।' },
  { path: '/policies', title: 'সম্পাদনা ও গোপনীয়তার নীতি | জিয়ার দৃষ্টিতে', description: 'লেখার উৎস, প্রকাশের তারিখ, সম্পাদনা, পুনঃপ্রকাশ, স্মৃতির গোপনীয়তা ও ব্যক্তিগত অনুরোধের নীতি।' },
] as const;

export function pageMetadata(path: string) {
  const page = sitePages.find(page => page.path === path);
  if (!page) throw new Error(`Missing page metadata: ${path}`);
  return { title: page.title, description: page.description, alternates: { canonical: page.path },
    openGraph: { type: 'website' as const, title: page.title, description: page.description, url: page.path },
    twitter: { card: 'summary' as const, title: page.title, description: page.description } };
}
