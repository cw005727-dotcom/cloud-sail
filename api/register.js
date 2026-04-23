// Vercel Serverless Function: /api/register
const INVITE_CODES = new Set([
  'YF2026A', 'YF2026B', 'YF2026C', 'YF2026D', 'YF2026E',
  'YF2026F', 'YF2026G', 'YF2026H', 'YF2026J', 'YF2026K',
  'VIP001', 'VIP002', 'VIP003', 'VIP004', 'VIP005',
  'CLOUD001', 'CLOUD002', 'CLOUD003', 'CLOUD004', 'CLOUD005',
  'TEST01', 'TEST02', 'TEST03', 'TEST04', 'TEST05',
  'DEMO01', 'DEMO02', 'DEMO03', 'DEMO04', 'DEMO05'
]);

const UPSTASH_URL = process.env.KV_REST_API_URL;
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN;

async function redisCommand(args) {
  const res = await fetch(UPSTASH_URL, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + UPSTASH_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  return res.json();
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: '只支持 POST' });

  try {
    const { name, phone, password, inviteCode } = req.body;
    if (!name || !phone || !password || !inviteCode) return res.status(400).json({ success: false, message: '请填写完整信息' });
    if (password.length < 8) return res.status(400).json({ success: false, message: '密码至少8位' });
    if (!/^1[3-9]\d{9}$/.test(phone)) return res.status(400).json({ success: false, message: '手机号格式不正确' });

    const code = inviteCode.toUpperCase().trim();
    if (!INVITE_CODES.has(code)) return res.status(400).json({ success: false, message: '邀请码无效' });

    // 检查手机号是否已注册
    const phoneKey = 'user:phone:' + phone;
    const existingUserId = await redisCommand(['GET', phoneKey]);
    if (existingUserId.result) {
      return res.status(409).json({ success: false, message: '该手机号已注册，请直接登录' });
    }

    const userId = 'user_' + Date.now().toString(36);
    const user = {
      id: userId,
      name: name.trim(),
      phone,
      password: simpleHash(password),
      createdAt: new Date().toISOString(),
      inviteCode: code
    };

    // 写入用户数据
    const setResult = await redisCommand(['SET', 'user:' + userId, JSON.stringify(user)]);
    if (setResult.error) {
      console.error('REDIS SET USER ERROR:', setResult);
      return res.status(500).json({ success: false, message: '数据库错误1' });
    }

    // 写入手机号索引
    const phoneResult = await redisCommand(['SET', 'user:phone:' + phone, userId]);
    if (phoneResult.error) {
      console.error('REDIS SET PHONE ERROR:', phoneResult);
      return res.status(500).json({ success: false, message: '数据库错误2' });
    }

    // 标记邀请码已用
    await redisCommand(['SET', 'invite:' + code, userId]);

    console.log('新用户注册:', user);
    return res.status(200).json({ success: true, message: '注册成功' });

  } catch (err) {
    console.error('注册错误:', err.message || err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
};
