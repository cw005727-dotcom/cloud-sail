// Vercel Serverless Function: /api/register
// 注册接口 - 验证邀请码，写入 Upstash Redis

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

// 发送命令到 Upstash Redis
async function redisCommand(args) {
  const res = await fetch(`${UPSTASH_URL}/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ args })
  });
  return res.json();
}

// 生成随机密码
function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let pwd = '';
  for (let i = 0; i < 8; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

// 简单哈希（生产环境用 bcrypt）
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '只支持 POST 请求' });
  }

  try {
    const { name, phone, inviteCode } = req.body;

    // 验证必填项
    if (!name || !phone || !inviteCode) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '手机号格式不正确' });
    }

    // 验证邀请码格式
    const normalizedCode = inviteCode.toUpperCase().trim();
    if (normalizedCode.length < 6) {
      return res.status(400).json({ success: false, message: '邀请码格式不正确' });
    }

    // 检查邀请码是否有效
    if (!INVITE_CODES.has(normalizedCode)) {
      return res.status(400).json({ success: false, message: '邀请码无效' });
    }

    // 检查邀请码是否已被使用
    const usedKey = `invite:${normalizedCode}`;
    const alreadyUsed = await redisCommand(['GET', usedKey]);
    if (alreadyUsed.result) {
      return res.status(400).json({ success: false, message: '邀请码已被使用' });
    }

    // 检查手机号是否已注册
    const phoneKey = `user:phone:${phone}`;
    const existingUser = await redisCommand(['GET', phoneKey]);
    if (existingUser.result) {
      return res.status(400).json({ success: false, message: '该手机号已注册' });
    }

    // 生成初始密码
    const initialPassword = generatePassword();
    const hashedPassword = simpleHash(initialPassword);

    // 创建用户
    const userId = 'user_' + Date.now().toString(36);
    const user = {
      id: userId,
      name: name.trim(),
      phone: phone,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      inviteCode: normalizedCode
    };

    // 写入 Redis: user:{id} 存储用户数据
    const userKey = `user:${userId}`;
    await redisCommand(['SET', userKey, JSON.stringify(user)]);

    // 写入 Redis: user:phone:{phone} -> userId（用于登录查询）
    await redisCommand(['SET', phoneKey, userId]);

    // 标记邀请码已使用
    await redisCommand(['SET', usedKey, userId]);

    console.log('新用户注册:', user);

    return res.status(200).json({
      success: true,
      message: '注册成功',
      data: {
        password: initialPassword,
        hint: '您的初始密码已生成，请妥善保管'
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    return res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
  }
};
