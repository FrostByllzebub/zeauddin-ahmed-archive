import { searchTokens } from './search-normalization';

export type SearchRecord = { slug: string; title: string; publication: string; publishedAt: string; publishedDateLabel: string; excerpt: string };
export type SearchShard = { records: SearchRecord[]; postings: Record<string, number[]> };

export function readArchiveQuery(params: URLSearchParams, records: ReadonlyArray<{ publication: string; publishedAt: string }>) {
  const publication = params.get('publication') ?? '', year = params.get('year') ?? '';
  return { query: params.get('q') ?? '',
    publication: records.some(record => record.publication === publication) ? publication : '',
    year: records.some(record => record.publishedAt.startsWith(year + '-')) ? year : '' };
}

export function archiveUrl(query: string, publication = '', year = '') {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (publication) params.set('publication', publication);
  if (year) params.set('year', year);
  return params.size ? '/archive?' + params.toString() : '/archive';
}

export function matchingRecordIndexes(shard: SearchShard, query: string) {
  const tokens = searchTokens(query);
  if (!tokens.length) return [];
  const sets = tokens.map(token => new Set(Object.entries(shard.postings)
    .filter(([term]) => term.startsWith(token)).flatMap(([, posting]) => posting)));
  return [...sets[0]].filter(index => sets.every(set => set.has(index)));
}

export function filterSearchRecords(records: SearchRecord[], publication = '', year = '') {
  return records.filter(record => (!publication || record.publication === publication)
    && (!year || record.publishedAt.startsWith(year + '-')));
}

// Immutable shard revisions keep CDN caches useful without serving old postings.
const shardRequests = new Map<string, Promise<SearchShard>>();
export function loadSearchShard(year: string, revision: string) {
  const url = `/search-shards/${year}.json?v=${revision}`;
  if (!shardRequests.has(url)) {
    shardRequests.set(url, fetch(url, { cache: 'force-cache' }).then(response => {
      if (!response.ok) throw new Error(`Search shard HTTP ${response.status}`);
      return response.json() as Promise<SearchShard>;
    }).catch(error => { shardRequests.delete(url); throw error; }));
  }
  return shardRequests.get(url)!;
}
