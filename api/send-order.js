export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let orderIdNum = 10000;

  try {
    const kvRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/incr/order_seq`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });
    const kvData = await kvRes.json();
    
    if (kvData.result) {
      orderIdNum = kvData.result;
      if (orderIdNum < 10000) {
        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/order_seq/10000`, {
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        });
        orderIdNum = 10000;
      }
    }
  } catch (err) {
    console.log('資料庫連線失敗，使用預設編號:', err);
  }

  const orderId = `#${orderIdNum}`;
  const { gameName, summaryText, paymentMethod, totalPrice, lineUserId } = req.body;
  
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  const flexMessage = {
    "type": "flex",
    "altText": `【${orderId}】您的訂單已建立，請查看明細`,
    "contents": {
      "type": "bubble",
      "header": {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          {
            "type": "image",
            "url": "https://cdn-icons-png.flaticon.com/512/3081/3081840.png",
            "size": "45px",
            "aspectRatio": "1:1",
            "aspectMode": "cover",
            "gravity": "center"
          },
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": "蝦蝦手遊儲值商店",
                "weight": "bold",
                "color": "#8c7a6b",
                "size": "xs"
              },
              {
                "type": "text",
                "text": "訂單已建立",
                "weight": "bold",
                "color": "#3a3532",
                "size": "lg",
                "margin": "xs"
              }
            ],
            "paddingStart": "md"
          }
        ],
        "paddingAll": "lg",
        "alignItems": "center"
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "訂單編號",
                "color": "#8c7a6b",
                "size": "sm"
              },
              {
                "type": "text",
                "text": "等待付款",
                "color": "#b8860b",
                "size": "sm",
                "align": "end",
                "weight": "bold"
              }
            ]
          },
          {
            "type": "text",
            "text": orderId,
            "weight": "bold",
            "size": "xxl",
            "color": "#3a3532",
            "margin": "sm"
          },
          {
            "type": "separator",
            "margin": "lg"
          },
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": gameName || "遊戲名稱",
                "weight": "bold",
                "size": "md",
                "color": "#3a3532",
                "margin": "md"
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  {
                    "type": "text",
                    "text": summaryText || "商品明細",
                    "size": "sm",
                    "color": "#66615b",
                    "wrap": true
                  }
                ],
                "margin": "sm"
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  {
                    "type": "text",
                    "text": "付款方式",
                    "size": "sm",
                    "color": "#66615b"
                  },
                  {
                    "type": "text",
                    "text": paymentMethod || "匯款",
                    "size": "sm",
                    "color": "#3a3532",
                    "align": "end",
                    "weight": "bold"
                  }
                ],
                "margin": "sm"
              }
            ],
            "backgroundColor": "#f2efe9",
            "paddingAll": "md",
            "cornerRadius": "md",
            "margin": "md"
          },
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": "總計",
                "size": "xs",
                "color": "#8c7a6b"
              },
              {
                "type": "text",
                "text": `NT$ ${totalPrice || 0}`,
                "weight": "bold",
                "size": "xl",
                "color": "#b8860b"
              }
            ],
            "backgroundColor": "#eae5dc",
            "paddingAll": "md",
            "cornerRadius": "md",
            "margin": "lg"
          },
          {
            "type": "text",
            "text": "提醒:付款後請幫我保留收據 再幫我回傳LINE客服",
            "size": "xs",
            "color": "#78746d",
            "wrap": true,
            "margin": "lg"
          }
        ],
        "paddingAll": "lg"
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "button",
            "action": {
              "type": "uri",
              "label": "前往 LINE 官方客服",
              "uri": "https://line.me/R/oaMessage/@189jtpve/"
            },
            "style": "primary",
            "color": "#8c6239"
          }
        ],
        "paddingAll": "lg"
      },
      "styles": {
        "header": { "backgroundColor": "#f7f5f0" },
        "body": { "backgroundColor": "#fcfbf8" },
        "footer": { "backgroundColor": "#fcfbf8" }
      }
    }
  };

  try {
    const recipients = [];
    if (lineUserId) {
      recipients.push(lineUserId);
    }

    if (recipients.length === 0) {
      console.log("警告: 找不到 lineUserId，無法發送 LINE 訊息");
    }

    for (const toId of recipients) {
      const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + channelAccessToken
        },
        body: JSON.stringify({
          to: toId,
          messages: [flexMessage]
        })
      });

      // 檢查 LINE API 回應是否成功
      if (!lineRes.ok) {
        const errorText = await lineRes.text();
        console.error("LINE API 拒絕發送錯誤:", errorText);
        return res.status(500).json({ error: `LINE API 失敗: ${errorText}` });
      }
    }

    return res.status(200).json({ success: true, orderId: orderId });
  } catch (err) {
    console.error("後端執行發生例外錯誤:", err.message);
    return res.status(500).json({ error: err.message });
  }
}