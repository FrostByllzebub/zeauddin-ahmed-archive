# Zeauddin Ahmed Column Archiving Standard

This document records the approved process and presentation standard established for the first archived column. Future writings should follow it unless the owner explicitly approves an exception.

## Editorial purpose

The website is a long-term, readable archive of Zeauddin Ahmed’s published writing. A reader should be able to read the complete authorized article on this website, while still being able to visit the original publication. The archive page should feel like an independent literary record, not a copy of a newspaper page.

## Required content for every article

Each article entry must include:

- A stable URL slug based on the article title, using transliterated Bengali or a clear romanized form.
- The complete article text, from beginning to end, preserving the original wording and paragraph order.
- The article title exactly as published, unless a clearly documented typographical correction is approved.
- Author name: `জিয়াউদ্দীন আহমেদ` unless the source identifies a different byline.
- Publication name.
- Publication section/category.
- Original publication date in machine-readable and Bengali display formats.
- The original publication URL as a clickable link.
- A preservation status, normally `পূর্ণ লেখা` when the complete authorized text is archived.
- A relevant hero image with a verifiable source, license/rights information, and a caption.

Do not add an invented summary, Bengali summary, highlighted excerpt, or artificial subheading. The article should begin directly with its first paragraph after the title and hero image unless the source itself contains an intentional subheading that the owner wants preserved.

## Rights and source handling

Full-text republication requires confirmation that the archive has permission. For this project, the owner confirmed that the writer’s personal website has permission to republish Zeauddin Ahmed’s writing.

For each article:

1. Record the original URL exactly.
2. Keep the source publication and section in the metadata.
3. Remove advertisements, unrelated recommendations, social widgets, navigation, and other newspaper-page clutter from the archived presentation.
4. Do not imply that the archive is the original newspaper publication.
5. Keep a local PDF snapshot when practical, so the article remains referenceable if the original URL later disappears. The snapshot should retain the article title, publication identity, publication date, image, full text, and original URL, but should not include a retrieval date unless explicitly requested.

The local reference-library destination currently used is:

`G:\My Drive\05 Reference Library\Articles\Zeauddin Ahmed's Columns`

## Image standard

Use a mature, high-quality archive-created editorial illustration that is materially relevant to the article. Do not use generic or decorative imagery.

Preferred image treatment:

1. Generate a topic-specific editorial illustration for the archive.
2. Use the approved archival ink-and-collage system: warm ivory paper, charcoal ink, muted indigo/olive, restrained terracotta, and one Bangladesh-red accent.
3. Keep the composition elegant and uncluttered, with one dominant metaphor and no irrelevant objects.

The image must have:

- A local copy in `public/articles/` with a descriptive filename.
- `heroImage` pointing to the local copy.
- `heroCaption` identifying it as an archive-created editorial illustration.
- `imageSourceUrl` and `imageCredit` may remain in the internal record for provenance, but are not shown in the public metadata panel for custom-generated images.

All 24 imported articles use local archive-created illustrations under `public/articles/custom-*.png`.

## Page layout standard

The approved article page uses a calm editorial/archive layout:

- Site header with archive navigation.
- Large Bengali article title.
- Hero image and concise caption.
- Full article body in a readable editorial column.
- A right-hand metadata panel titled `লেখাটির পরিচিতি`.
- Footer with archive and copyright/contact links.

The metadata panel uses consistent definition-list rows. Labels and values use the same base metadata typography. The original publication link is the only source-related row:

- `মূল প্রকাশনার URL` — original article link on the right.
The original publication URL remains on one line on desktop, using a slightly tighter size only when needed to fit the row. On narrow screens, it may wrap for readability.

## Data-entry pattern

Add each article to `lib/articles.ts` using the existing `ArchiveArticle` shape. The minimum approved pattern is:

```ts
{
  slug: "clear-article-slug",
  title: "প্রকাশিত শিরোনাম",
  author: "জিয়াউদ্দীন আহমেদ",
  publication: "প্রকাশনার নাম",
  section: "বিভাগ",
  publishedAt: "YYYY-MM-DD",
  publishedDateLabel: "বাংলা তারিখ",
  originalUrl: "https://example.com/original-article",
  rightsStatus: "full_text_permitted",
  heroImage: "/articles/local-image.jpg",
  heroCaption: "ছবির সংক্ষিপ্ত, যাচাইযোগ্য ক্যাপশন",
  imageSourceUrl: "https://verified-image-source.example/page",
  imageCredit: "প্রতিষ্ঠান বা আলোকচিত্রীর ক্রেডিট",
  body: [
    { paragraphs: ["প্রথম পূর্ণ অনুচ্ছেদ..."] },
    { paragraphs: ["পরের অনুচ্ছেদ...", "আরও একটি অনুচ্ছেদ..."] },
  ],
  authorNote: "",
  authorCredit: "",
}
```

Keep paragraph boundaries meaningful. Use `heading` only when the published writing genuinely contains a subheading that should remain. Do not create a heading merely to make the page look structured.

## Intake checklist

Before adding an article:

- Confirm the source URL loads and identify the title, byline, publication, section, date, image, and complete body.
- Confirm full-text permission or mark the entry `metadata_only`.
- Strip advertisements and unrelated page elements.
- Preserve the complete article text; do not summarize or rewrite it.
- Obtain a real, relevant, reusable image and record its source/credit.
- Create or update the local PDF snapshot when appropriate.
- Check Bengali spelling and typography without changing the author’s meaning or voice.

## Review checklist

Before deployment, verify:

- The title is correct.
- The body begins directly with the intended first paragraph.
- No ads, source-page navigation, or unrelated recommendation text is present.
- The right panel contains all five standard metadata fields plus the two right-aligned source links.
- The original URL opens in a new tab.
- The image-source link opens the verifiable source page.
- The image is real and relevant, not generated.
- The article is readable on desktop and narrow screens.
- The slug, source URL, image source, and rights status are recorded in the project ledgers where applicable.

## Deployment and verification

The site is deployed through GitHub Pages from the `main` branch. After a content or layout change:

1. Run the available project checks/build. If local dependencies are missing, record that limitation and rely on the GitHub Actions result.
2. Review `git diff --check` and the final diff.
3. Commit with a focused message.
4. Push to `main` and confirm the GitHub Pages workflow succeeds.
5. Open the live article in Edge with a cache-busting query when necessary, for example `?v=<commit>`, and visually verify the page.

The cache-busting query is only for verification; it is not part of the article’s canonical URL.

## Established reference implementation

The first completed implementation is:

`/articles/brics-sommelon-o-bangladesher-koutnoitik-hisab/`

It is the visual and structural reference for subsequent columns. Future entries should reuse the same page component, sidebar structure, typography, source-link treatment, image-credit pattern, and deployment workflow rather than creating a separate article layout.
