import { kvDel, kvGet, kvSet } from '@vercel/kv';

const UPSTASH_URL = process.env.KV_REST_API_URL;
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN;

async function redisCommand(args) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error('KV environment variables not configured');
  }
  const res = await fetch(UPSTASH_URL, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + UPSTASH_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  return res.json();
}

const DEFAULT_SITE_CONFIG = {
  pageTitle: '云帆跨境工作台',
  heroTitle: '云帆跨境工作台',
  heroSubtitle: '高效采集 · 智能优化 · 一键发布',
  heroImage: '',
  sites: [],
  navItems: [
    { id: 'collect', label: '商品采集', icon: '📦', type: 'page' },
    { id: 'ai', label: 'AI 图文优化', icon: '✨', type: 'page' },
    { id: 'publish', label: '发布管理', icon: '🚀', type: 'page' },
    { id: 'analytics', label: '数据分析', icon: '📊', type: 'page' },
    { id: 'account', label: '账号管理', icon: '⚙️', type: 'page' },
    { id: 'ml-center', label: '美客多运营中心', icon: '📚', type: 'link', url: 'ml-center.html' }
  ]
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      let config = await redisCommand(['GET', 'site:config']);
      if (config.error || !config.result) {
        // 初始化默认配置
        await redisCommand(['SET', 'site:config', JSON.stringify(DEFAULT_SITE_CONFIG)]);
        return res.status(200).json(DEFAULT_SITE_CONFIG);
      }
      return res.status(200).json(JSON.parse(config.result));
    }

    if (req.method === 'POST') {
      const newConfig = req.body;
      let current = await redisCommand(['GET', 'site:config']);
      let existing = current.result ? JSON.parse(current.result) : { ...DEFAULT_SITE_CONFIG };
      const merged = { ...existing, ...newConfig };
      await redisCommand(['SET', 'site:config', JSON.stringify(merged)]);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('site-config error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
