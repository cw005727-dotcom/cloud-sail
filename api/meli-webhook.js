import { readFileSync } from 'fs';
import { join } from 'path';

const CONFIG_PATH = join(process.cwd(), 'data', 'site-config.json');
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { resource, topic, user_id } = req.body;
  console.log(`[Meli Webhook] topic=${topic} user=${user_id} resource=${resource}`);

  // 回复200，释放MelI连接
  res.status(200).json({ received: true });

  // 异步处理订单详情
  if (topic === 'orders_v2' && resource) {
    const orderId = resource.split('/').pop();
    console.log(`[Meli] 新订单: ${orderId}`);

    try {
      const response = await fetch(`https://api.mercadolibre.com/marketplace/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${config.meliAccessToken}`
        },
        timeout: 10000
      });

      if (!response.ok) {
        console.error(`[Meli] 拉取订单失败: ${response.status}`);
        return;
      }

      const order = await response.json();

      const paidAmount = order.paid_amount || 0;
      const orderItems = order.order_items || [];
      const totalFee = orderItems.reduce((sum, item) => sum + (item.sale_fee || 0), 0);
      const totalTax = (order.taxes && order.taxes.amount) || 0;
      const net = (paidAmount - totalFee - totalTax).toFixed(2);

      const message = [
        `🛒 新订单通知`,
        `订单号: ${orderId}`,
        `状态: ${order.status}`,
        `金额: $${paidAmount} USD`,
        `平台费: $${totalFee.toFixed(2)}`,
        `税费: $${totalTax.toFixed(2)}`,
        `净收益: $${net}`,
        `商品: ${orderItems[0]?.item?.title || 'N/A'}`,
        `数量: ${orderItems.reduce((s, i) => s + i.quantity, 0)}件`
      ].join('\n');

      // 发微信通知
      if (config.wechat?.webhook) {
        await fetch(config.wechat.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ msgtype: 'text', text: { content: message } })
        });
        console.log(`[Meli] 微信通知已发送`);
      }
    } catch (err) {
      console.error(`[Meli] 处理订单出错:`, err);
    }
  }
}
