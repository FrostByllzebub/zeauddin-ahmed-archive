export const memoryApi = () =>
  process.env.NEXT_PUBLIC_MEMORY_API_URL ||
  (typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? ""
    : "https://zeauddinahmed.com");
export const memoryStatus: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  reviewed: "পর্যালোচিত",
  published: "প্রকাশিত",
  rejected: "প্রকাশের জন্য নির্বাচিত হয়নি",
  withdrawn: "প্রত্যাহৃত",
};
