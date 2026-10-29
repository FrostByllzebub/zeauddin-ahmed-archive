export const requestCategories = {
  correction: "লেখার সংশোধন",
  rights: "অধিকার বা অপসারণ",
  privacy: "গোপনীয়তা ও অন্যান্য অনুরোধ",
} as const;
export function validateEditorialRequest(data: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  if (
    !(
      typeof data.category === "string" &&
      Object.hasOwn(requestCategories, data.category)
    )
  )
    errors.category = "অনুরোধের ধরন বেছে নিন।";
  if (
    typeof data.email !== "string" ||
    data.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  )
    errors.email = "সঠিক ইমেইল ঠিকানা লিখুন।";
  if (
    typeof data.message !== "string" ||
    data.message.trim().length < 20 ||
    data.message.length > 4000
  )
    errors.message = "২০–৪০০০ অক্ষরে অনুরোধটি লিখুন।";
  if (data.articleUrl || data.category !== "privacy") {
    try {
      const u = new URL(String(data.articleUrl));
      if (
        u.protocol !== "https:" ||
        !["zeauddinahmed.com", "www.zeauddinahmed.com"].includes(u.hostname) ||
        !u.pathname.startsWith("/articles/") ||
        u.username ||
        u.password
      )
        throw Error();
    } catch {
      errors.articleUrl = "এই আর্কাইভের সংশ্লিষ্ট লেখার সম্পূর্ণ লিংক দিন।";
    }
  }
  if (data.consent !== true)
    errors.consent = "অনুরোধটি পর্যালোচনা ও এ বিষয়ে যোগাযোগের অনুমতি দিন।";
  if (
    typeof data.submissionKey !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(data.submissionKey)
  )
    errors.submissionKey = "পাতাটি নতুন করে খুলে চেষ্টা করুন।";
  return errors;
}
