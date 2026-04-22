// Vercel Serverless Function: /api/login
// 登录接口 - 从 Upstash Redis 验证用户

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

// 简单哈希（与 register.js 一致）
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

function generateToken() {
  return 'yf_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 15);
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
    const { phone, password } = req.body;

    // 验证必填项
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '请填写手机号和密码' });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '手机号格式不正确' });
    }

    // 查询用户
    const phoneKey = `user:phone:${phone}`;
    const userIdResult = await redisCommand(['GET', phoneKey]);

    if (!userIdResult.result) {
      return res.status(401).json({ success: false, message: '手机号未注册' });
    }

    const userId = userIdResult.result;

    // 获取用户数据
    const userKey = `user:${userId}`;
    const userResult = await redisCommand(['GET', userKey]);

    if (!userResult.result) {
      return res.status(401).json({ success: false, message: '用户数据异常' });
    }

    const user = JSON.parse(userResult.result);

    // 验证密码
    const hashedPassword = simpleHash(password);
    if (hashedPassword !== user.password) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }

    // 生成 token
    const token = generateToken();

    // 存储 token（24小时过期）
    const tokenKey = `token:${token}`;
    await redisCommand(['SET', tokenKey, userId, 'EX', 86400]);

    console.log('用户登录:', user.name, phone);

    return res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token: token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
  }
};
