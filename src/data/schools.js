import { load } from 'js-yaml';
import schoolSource from '../../assets/schools/data/schools.yaml?raw';
import participantSource from '../../assets/schools/data/participants.csv?raw';

// Both files remain editable in assets/schools/data. Vite bundles them locally.
export const schools = load(schoolSource);

function parseCSV(source) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (char === ',' || char === '\n')) {
      row.push(cell.trim()); cell = '';
      if (char === '\n') { rows.push(row); row = []; }
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  const headers = rows.shift();
  return rows.filter(values => values.some(Boolean)).map(values =>
    Object.fromEntries(headers.map((header, i) => [header, values[i] || ''])));
}

export const participants = parseCSV(participantSource);
