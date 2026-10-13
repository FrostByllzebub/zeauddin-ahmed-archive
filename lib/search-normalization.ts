const bengaliDigits = "০১২৩৪৫৬৭৮৯";

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u200c\u200d]/g, "")
    .replace(/য়/g, "য়")
    .replace(/ড়/g, "ড়")
    .replace(/ঢ়/g, "ঢ়")
    .replace(/ইসরাইল/g, "ইসরায়েল")
    .replace(/ইসলামী/g, "ইসলাম")
    .replace(/ইসলামি/g, "ইসলাম")
    .replace(/[০-৯]/g, (digit) => String(bengaliDigits.indexOf(digit)))
    .replace(/[^\u0980-\u09FFA-Za-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function searchTokens(value: string) {
  return normalizeSearchText(value).split(/\s+/).filter(Boolean);
}
