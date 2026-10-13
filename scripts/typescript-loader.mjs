import { readFile, access } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

export async function resolve(specifier, context, nextResolve) {
  try { return await nextResolve(specifier, context); }
  catch (error) {
    if (!specifier.startsWith('.') || !context.parentURL) throw error;
    for (const suffix of ['.ts', '.mjs', '/index.ts']) {
      const url = new URL(specifier + suffix, context.parentURL);
      try { await access(url); return { url: url.href, shortCircuit: true }; } catch {}
    }
    throw error;
  }
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && url.endsWith('.ts')) {
    return { format: 'module', source: stripTypeScriptTypes(await readFile(new URL(url), 'utf8')), shortCircuit: true };
  }
  return nextLoad(url, context);
}
