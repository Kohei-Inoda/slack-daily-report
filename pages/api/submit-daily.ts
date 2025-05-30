import type { NextApiRequest, NextApiResponse } from 'next';

const SLACK_API_BASE = 'https://slack.com/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dateLabel, text } = req.body;
  
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_CHANNEL_ID) {
    console.error("Slack環境変数が未設定です");
    return res.status(500).json({ error: "Slack設定が未構成です（管理者に連絡してください）" });
  }
  
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;

  if (!dateLabel || !text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

// 🔁 修正：conversations.history を GET + クエリパラメータに変更
const historyRes = await fetch(
    `${SLACK_API_BASE}/conversations.history?channel=${channel}&limit=100`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  

  const historyJson = await historyRes.json();

  if (!historyJson.ok) {
    console.error('Failed to fetch history:', historyJson);
    return res.status(500).json({ error: 'Failed to fetch channel history' });
  }

  const datePattern = new RegExp(`\\b${dateLabel}\\b`);
  let parentTs = null;
  type SlackMessage = { text: string; ts: string };
  const existing = (historyJson.messages as SlackMessage[]).find(
    (msg) => msg.text.includes('日報') && datePattern.test(msg.text)
  );
  

  if (existing) {
    parentTs = existing.ts;
  } else {
    const parentRes = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text: `📅 ${dateLabel} 日報\nこのスレッドに返信で日報を提出してください！`,
      }),
    });

    const parentJson = await parentRes.json();
    if (!parentJson.ok) {
      console.error('Failed to post parent message:', parentJson);
      return res.status(500).json({ error: 'Failed to post parent message' });
    }

    parentTs = parentJson.ts;
  }

  const replyRes = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel,
      text,
      thread_ts: parentTs,
    }),
  });

  const replyJson = await replyRes.json();

  if (!replyJson.ok) {
    console.error('Failed to post reply:', replyJson);
    return res.status(500).json({ error: 'Failed to post daily report' });
  }

  return res.status(200).json({ success: true });
}
