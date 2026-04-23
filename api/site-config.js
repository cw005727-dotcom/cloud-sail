import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const dataPath = join(process.cwd(), 'data/courses.json');

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
      res.status(200).json(data.siteConfig || {});
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else if (req.method === 'POST') {
    try {
      const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
      data.siteConfig = { ...data.siteConfig || {}, ...req.body };
      writeFileSync(dataPath, JSON.stringify(data, null, 2));
      res.status(200).json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
