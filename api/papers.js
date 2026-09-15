import { createPapersHandler } from '../server/papers-handler.js';
import { papersService } from '../server/vercel-papers.js';

export default createPapersHandler({ service: papersService });
