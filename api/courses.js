import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  const filePath = join(process.cwd(), 'api/courses.json');

  if (req.method === 'GET') {
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      res.status(200).json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load courses' });
    }
  } else if (req.method === 'PUT') {
    try {
      const data = req.body;
      writeFileSync(filePath, JSON.stringify(data, null, 2));
      res.status(200).json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to save courses' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
