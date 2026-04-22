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

function generateToken() {
  return 'yf_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 15);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: '只支持 POST' });

  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ success: false, message: '请填写手机号和密码' });
    if (!/^1[3-9]\d{9}$/.test(phone)) return res.status(400).json({ success: false, message: '手机号格式不正确' });

    const phoneKey = 'user:phone:' + phone;
    const userIdResult = await redisCommand(['GET', phoneKey]);
    if (userIdResult.error) { console.error('REDIS GET USERID ERROR:', userIdResult); return res.status(500).json({ success: false, message: '数据库错误' }); }
    if (!userIdResult.result) return res.status(401).json({ success: false, message: '手机号未注册' });

    const userKey = 'user:' + userIdResult.result;
    const userResult = await redisCommand(['GET', userKey]);
    if (userResult.error) { console.error('REDIS GET USER ERROR:', userResult); return res.status(500).json({ success: false, message: '数据库错误' }); }
    if (!userResult.result) return res.status(401).json({ success: false, message: '用户数据异常' });

    const user = JSON.parse(userResult.result);
    if (simpleHash(password) !== user.password) return res.status(401).json({ success: false, message: '密码错误' });

    const token = generateToken();
    await redisCommand(['SET', 'token:' + token, user.id, 'EX', '86400']);

    console.log('用户登录:', user.name, phone);
    return res.status(200).json({
      success: true,
      message: '登录成功',
      data: { token, user: { id: user.id, name: user.name, phone: user.phone, createdAt: user.createdAt } }
    });

  } catch (err) {
    console.error('登录错误:', err.message || err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
};
