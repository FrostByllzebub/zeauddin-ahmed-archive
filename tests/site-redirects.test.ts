import test from "node:test";
import assert from "node:assert/strict";
import { retiredSitePaths, retiredSiteRedirect } from "../lib/site-redirects";
import { publicationArtifacts } from "../scripts/publication-artifacts";

test("retired publications URLs permanently redirect while retaining archive filters", () => {
  for (const path of retiredSitePaths) {
    const response = retiredSiteRedirect(
      new Request(`https://zeauddinahmed.com${path}?year=2026`),
    );
    assert.equal(response?.status, 301);
    assert.equal(
      response?.headers.get("location"),
      "https://zeauddinahmed.com/archive?year=2026",
    );
  }
  assert.equal(
    retiredSiteRedirect(new Request("https://zeauddinahmed.com/archive")),
    undefined,
  );
});

test("retired page is excluded from the sitemap and retained as redirect rules", () => {
  const artifacts = publicationArtifacts();
  assert(!artifacts.get("public/sitemap.xml")!.includes("/publications"));
  for (const path of retiredSitePaths)
    assert(
      artifacts.get("public/_redirects")!.includes(`${path} /archive 301`),
    );
});
