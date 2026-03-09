const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// 替换成你的信息
const APP_ID = 'cli_a9272bac75789cc1';
const APP_SECRET = 'jwHO5aCaaqvr1g8xKTpuLdBz2nmS7Zur';
const OPENAI_KEY = 'sk-nq8KjCcoQObfysj9tw75pDPPWosGg7Hggd7u3D21mbiUxMJ2';

// 处理飞书 URL 验证
app.post('/webhook', async (req, res) => {
  if (req.body.type === 'url_verification') {
    return res.json({ challenge: req.body.challenge });
  }

  if (req.body.header?.event_type === 'im.message.receive_v1') {
    const { message_id, content } = req.body.event.message;
    const userText = JSON.parse(content).text.toLowerCase();

    try {
      let aiReply = '';

      // 1. 爆款视频分析
      if (userText.includes('找爆款') || userText.includes('爆款视频')) {
        aiReply = `
📊 今日爆款视频分析（模拟数据）：
1. 科技感视频：《用AI生成震撼龙形特效》，播放量1200w+，关键词：AI、龙、特效
2. 生活技巧：《30秒搞定MacBook清理》，播放量800w+，关键词：技巧、效率
3. 情感共鸣：《北漂女孩的深夜食堂》，播放量1500w+，关键词：北漂、治愈、美食

💡 爆款规律：
- 标题多用数字和痛点（如“30秒”、“搞定”）
- 封面用高对比度、强视觉冲击的画面
- 发布时间集中在晚8-10点（用户活跃高峰）
        `;
      }
      // 2. 写爆款文案
      else if (userText.includes('写文案') || userText.includes('写标题') || userText.includes('写脚本')) {
        const prompt = `你是专业的抖音/视频号运营专家，根据用户需求生成爆款文案：
用户需求：${userText}
要求：
- 标题：抓眼球，用数字、痛点、悬念
- 脚本：分镜头，口语化，有节奏感
- 评论区：引导互动，提高完播率`;

        const openaiRes = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1024,
            temperature: 0.8
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENAI_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        aiReply = openaiRes.data.choices[0].message.content.trim();
      }
      // 3. 自动运营建议
      else if (userText.includes('运营') || userText.includes('推广')) {
        const prompt = `你是资深短视频运营专家，根据账号情况给出运营策略：
账号情况：${userText}
建议包括：
- 内容定位：明确账号人设和赛道
- 发布计划：每周发布频率和最佳时间
- 涨粉策略：如何通过爆款视频和互动涨粉
- 数据分析：监控哪些关键指标`;

        const openaiRes = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1024,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENAI_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        aiReply = openaiRes.data.choices[0].message.content.trim();
      }
      // 4. 默认调用 Codex 写代码
      else {
        const openaiRes = await axios.post(
          'https://api.openai.com/v1/completions',
          {
            model: 'code-davinci-002',
            prompt: userText,
            max_tokens: 1024,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENAI_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        aiReply = openaiRes.data.choices[0].text.trim();
      }

      // 获取飞书 tenant_access_token
      const tokenRes = await axios.post(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        { app_id: APP_ID, app_secret: APP_SECRET }
      );
      const tenantToken = tokenRes.data.tenant_access_token;

      // 回复飞书消息
      await axios.post(
        `https://open.feishu.cn/open-apis/im/v1/messages/${message_id}/reply`,
        {
          msg_type: 'text',
          content: JSON.stringify({ text: aiReply })
        },
        {
          headers: {
            'Authorization': `Bearer ${tenantToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (err) {
      console.error('处理失败:', err);
      await axios.post(
        `https://open.feishu.cn/open-apis/im/v1/messages/${message_id}/reply`,
        {
          msg_type: 'text',
          content: JSON.stringify({ text: '抱歉，处理失败了，请稍后再试。' })
        },
        {
          headers: {
            'Authorization': `Bearer ${tenantToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }

  res.json({ code: 0 });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log('✅ AI 视频运营助手已启动');
});
