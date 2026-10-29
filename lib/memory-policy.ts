/** The only public projection: private names, contact details and management hashes never leave the editor API. */
export function publicMemory(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    story: row.story,
    displayName: row.anonymous ? "নাম প্রকাশে অনিচ্ছুক" : row.public_name,
    relationship: row.relationship,
    photoUrl:
      row.photo_key && row.consent_photo
        ? `/api/memories/photo/${row.id}`
        : null,
    photoCaption: row.consent_photo ? row.photo_caption : null,
    photoDate: row.consent_photo ? row.photo_date : null,
    publishedAt: row.published_at,
  };
}
export const relationships = [
  "পরিবারের সদস্য",
  "বন্ধু",
  "সহকর্মী",
  "পাঠক",
  "অন্যভাবে পরিচিত",
];
export function normalizePhone(value: string) {
  return value.replace(/[০-৯]/g, (c) => String("০১২৩৪৫৬৭৮৯".indexOf(c)));
}
export function validateMemory(
  input: Record<string, string>,
  hasPhoto: boolean,
) {
  const errors: Record<string, string> = {};
  if (!input.name?.trim() || input.name.length > 160)
    errors.name = "আপনার নাম লিখুন (সর্বোচ্চ ১৬০ অক্ষর)।";
  if (
    input.attribution !== "anonymous" &&
    (!input.publicName?.trim() || input.publicName.length > 160)
  )
    errors.publicName = "প্রকাশের জন্য একটি নাম লিখুন।";
  if (!relationships.includes(input.relationship))
    errors.relationship = "একটি পরিচয় বেছে নিন।";
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || "") ||
    input.email.length > 254
  )
    errors.email = "সঠিক ইমেইল ঠিকানা লিখুন।";
  if (
    input.phone &&
    (!/^[+\d\s().-]{6,32}$/.test(normalizePhone(input.phone)) ||
      normalizePhone(input.phone).replace(/\D/g, "").length < 6)
  )
    errors.phone = "দেশের কোডসহ সঠিক ফোন নম্বর লিখুন।";
  if ((input.title || "").length > 160)
    errors.title = "শিরোনাম সর্বোচ্চ ১৬০ অক্ষরের হতে পারে।";
  if (
    !input.story ||
    input.story.trim().length < 20 ||
    input.story.length > 6000
  )
    errors.story = "২০ থেকে ৬০০০ অক্ষরের মধ্যে আপনার স্মৃতি লিখুন।";
  if (input.consentStory !== "true")
    errors.consentStory = "গল্প প্রকাশের জন্য বিবেচনার অনুমতি দিন।";
  if (hasPhoto && input.consentPhoto !== "true")
    errors.consentPhoto = "ছবি প্রকাশের অনুমতি দিন অথবা ছবিটি সরিয়ে নিন।";
  if ((input.photoCaption || "").length > 500)
    errors.photoCaption = "ছবির বিবরণ সর্বোচ্চ ৫০০ অক্ষরের হতে পারে।";
  if ((input.photoDate || "").length > 100)
    errors.photoDate = "সময় বা তারিখ সর্বোচ্চ ১০০ অক্ষরের হতে পারে।";
  return errors;
}
export function validPhotoBytes(bytes: Uint8Array, type: string) {
  let width = 0,
    height = 0;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (type === "image/png") {
    if (
      bytes.length < 45 ||
      ![137, 80, 78, 71, 13, 10, 26, 10].every((x, i) => bytes[i] === x) ||
      new TextDecoder().decode(bytes.slice(12, 16)) !== "IHDR" ||
      new TextDecoder().decode(bytes.slice(-8, -4)) !== "IEND"
    )
      return false;
    width = view.getUint32(16);
    height = view.getUint32(20);
  } else if (type === "image/jpeg") {
    if (
      bytes.length < 20 ||
      bytes[0] !== 255 ||
      bytes[1] !== 216 ||
      bytes[bytes.length - 2] !== 255 ||
      bytes[bytes.length - 1] !== 217
    )
      return false;
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 255) return false;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) return false;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) return false;
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      ) {
        if (length < 8) return false;
        height = view.getUint16(offset + 3);
        width = view.getUint16(offset + 5);
        break;
      }
      offset += length;
    }
  } else if (type === "image/webp") {
    if (
      bytes.length < 30 ||
      new TextDecoder().decode(bytes.slice(0, 4)) !== "RIFF" ||
      new TextDecoder().decode(bytes.slice(8, 12)) !== "WEBP" ||
      view.getUint32(4, true) + 8 !== bytes.length
    )
      return false;
    const chunk = new TextDecoder().decode(bytes.slice(12, 16));
    if (chunk === "VP8X") {
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (
      chunk === "VP8 " &&
      bytes[23] === 0x9d &&
      bytes[24] === 1 &&
      bytes[25] === 0x2a
    ) {
      width = view.getUint16(26, true) & 0x3fff;
      height = view.getUint16(28, true) & 0x3fff;
    } else if (chunk === "VP8L" && bytes[20] === 0x2f) {
      width = 1 + bytes[21] + ((bytes[22] & 0x3f) << 8);
      height =
        1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10);
    }
  } else return false;
  return (
    width > 0 &&
    height > 0 &&
    width <= 12000 &&
    height <= 12000 &&
    width * height <= 40000000
  );
}
export function transition(status: string, action: string, consented: boolean) {
  if (action === "review" && status === "pending") return "reviewed";
  if (action === "publish" && status === "reviewed" && consented)
    return "published";
  if (action === "reject" && ["pending", "reviewed"].includes(status))
    return "rejected";
  if (action === "unpublish" && status === "published") return "reviewed";
  if (action === "restore" && status === "rejected") return "pending";
  return null;
}
