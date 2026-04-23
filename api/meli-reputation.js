import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const CACHE_FILE = join(process.cwd(), 'data', 'reputation_cache.json');
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');

  // Check cache
  if (existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
      if (Date.now() - cached.ts < CACHE_TTL) {
        return res.status(200).json(cached.data);
      }
    } catch {}
  }

  const token = process.env.MELI_TOKEN || process.env.MELI_ACCESS_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'MELI_TOKEN not configured' });
  }

  try {
    const apiRes = await fetch('https://api.mercadolibre.com/global/users/seller_reputation', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!apiRes.ok) {
      throw new Error(`Meli API ${apiRes.status}`);
    }

    const data = await apiRes.json();
    const reps = data.seller_reputation || [];

    const SITE_NAMES = { MLM: '🇲🇽 墨西哥', MLA: '🇦🇷 阿根廷', MCO: '🇨🇴 哥伦比亚', MLB: '🇧🇷 巴西', MLC: '🇨🇱 智利', MLU: '🇺🇾 乌拉圭' };
    const LEVEL_COLORS = {
      '5_green': '#10B981',
      '4_light_green': '#6EE7B7',
      '3_neutral': '#F59E0B',
      '2_orange': '#F97316',
      '1_red': '#EF4444',
    };

    const result = reps.map(rep => {
      const site = rep.site_id;
      const sr = rep.seller_reputation || {};
      const lvl = sr.level_id || '?';
      const tx = sr.transactions || {};
      const mt = sr.metrics || {};
      return {
        site,
        siteName: SITE_NAMES[site] || site,
        levelId: lvl,
        color: LEVEL_COLORS[lvl] || '#9CA3AF',
        logisticType: rep.logistic_type || '-',
        transactions: {
          completed: tx.completed || 0,
          cancelled: tx.cancelled || 0,
          total: (tx.completed || 0) + (tx.cancelled || 0),
        },
        ratings: {
          positive: tx.ratings?.positive || 0,
          neutral: tx.ratings?.neutral || 0,
          negative: tx.ratings?.negative || 0,
        },
        metrics: {
          delayedRate: mt.delayed_handling_time?.rate || 0,
          claimsRate: mt.claims?.rate || 0,
          delayedPercent: Math.round((mt.delayed_handling_time?.rate || 0) * 100),
        },
      };
    });

    // Cache
    try {
      writeFileSync(CACHE_FILE, JSON.stringify({ ts: Date.now(), data: result }));
    } catch {}

    res.status(200).json(result);
  } catch (err) {
    // Fallback to cache on error
    if (existsSync(CACHE_FILE)) {
      try {
        const cached = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
        return res.status(200).json(cached.data);
      } catch {}
    }
    res.status(500).json({ error: err.message });
  }
}
