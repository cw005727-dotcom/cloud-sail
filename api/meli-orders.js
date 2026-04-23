import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filePath = join(process.cwd(), 'workspace', 'meli_orders_detail_clean.csv');
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'No data file found' });
    }

    const text = readFileSync(filePath, 'utf-8');
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');

    const rows = lines.slice(1).map(line => {
      const vals = [];
      let current = '';
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { vals.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      vals.push(current.trim());
      const r = {};
      headers.forEach((h, i) => r[h] = vals[i] || '');
      return r;
    }).filter(r => r['订单号']);

    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
