import { register } from 'node:module';

// Node >=22.13 provides the type stripper; no tsx install is needed for scripts.
register('./typescript-loader.mjs', import.meta.url);
