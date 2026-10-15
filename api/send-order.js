export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let orderIdNum = 10000;

  try {
    // 透過 Upstash 雲端資料庫將編號自動 +1 (絕對不會重複、不會歸零)
    const kvRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/incr/order_seq`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });
    const kvData = await kvRes.json();
    
    if (kvData.result) {
      orderIdNum = kvData.result;
      
      // 如果是全新資料庫（數字小於 10000），強制初始化從 10000 開始
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
  const channelAccessToken = "xywTd6UKsCMAcLpQPxtnZ0eQVaydPrO3lNO+muCX869CyzJKBh7Kze+IqtUE1OBBZdb4kFv0HpLdAMuE81Zu8KXITIZqO3bjNZrDsNH1ITMYc+YfnG2CSv20ehFWPf6fXiaEHmIu0pB6pjK50w5H9QdB04t89/1O/w1cDnyilFU=";

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
    // 只發送給下單的客人，絕對不傳送給老闆
    const recipients = [];
    if (lineUserId) {
      recipients.push(lineUserId);
    }

    await Promise.all(recipients.map(toId => 
      fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + channelAccessToken
        },
        body: JSON.stringify({
          to: toId,
          messages: [flexMessage]
        })
      })
    ));

    return res.status(200).json({ success: true, orderId: orderId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}