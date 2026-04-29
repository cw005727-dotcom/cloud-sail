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

      // 写入yunfan-pro-dev本地数据库
      if (config.yunfanRelayUrl) {
        try {
          const relayPayload = {
            id: orderId,
            user_id: order.seller_id || null,
            site_id: order.site_id || null,
            order_date: order.date_created || null,
            product_name: orderItems[0]?.item?.title || null,
            quantity: orderItems.reduce((s, i) => s + i.quantity, 0) || null,
            amount: paidAmount,
            platform_fee: totalFee,
            tax: totalTax,
            net_profit: parseFloat(net),
            status: order.status,
            shipping_status: order.shipping_status,
            paid_amount: paidAmount,
            last_ship_date: order.order_workflow?.shipping_date || null,
            tracking_id: order.shipping?.id || null,
            logistic_type: order.shipping?.logistic_type || null,
          };
          const relayResp = await fetch(`${config.yunfanRelayUrl}/api/ml/webhook/relay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(relayPayload)
          });
          const relayResult = await relayResp.json();
          console.log(`[Meli] 写入本地DB: ${JSON.stringify(relayResult)}`);
        } catch (err) {
          console.error(`[Meli] 写入本地DB失败:`, err);
        }
      }
    } catch (err) {
      console.error(`[Meli] 处理订单出错:`, err);
    }
  }
}
