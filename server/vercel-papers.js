import { getCache } from '@vercel/functions';
import { createPapersService } from './papers.js';

// Both endpoints are pinned to the same region in vercel.json.
export const papersService = createPapersService({ cache: getCache() });
