import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { publicationArtifacts } from './publication-artifacts';

for (const [file, content] of publicationArtifacts()) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, 'utf8');
}
console.log('Generated metadata, versioned search shards, sitemap, robots and redirects from the article catalog.');
