import { writeFile } from "node:fs/promises";
import { legacyArticleSlugs } from "../lib/articleRedirects";

const redirects = Object.entries(legacyArticleSlugs)
  .map(([legacy, canonical]) => `/articles/${legacy} /articles/${canonical} 301`)
  .join("\n");

await writeFile("public/_redirects", `${redirects}\n`, "utf8");
console.log(`Generated ${Object.keys(legacyArticleSlugs).length} permanent article redirects.`);
