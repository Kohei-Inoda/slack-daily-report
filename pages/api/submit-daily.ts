import type { NextApiRequest, NextApiResponse } from 'next';

const SLACK_API_BASE = 'https://slack.com/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { channel, dateLabel, text } = req.body;
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token || !channel || !dateLabel || !text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ステップ1: メッセージ履歴を取得
  const historyRes = await fetch(`${SLACK_API_BASE}/conversations.history`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel,
      limit: 100,
    }),
  });

  const historyJson = await historyRes.json();

  if (!historyJson.ok) {
    return res.status(500).json({ error: 'Failed to fetch channel history' });
  }

  // ステップ2: 「📅 5/27」などのメッセージを探す
  let parentTs = null;
  const datePattern = new RegExp(`\\b${dateLabel}\\b`); // "5/27" など
  const existing = historyJson.messages.find((msg: any) =>
    msg.text.includes('日報') && datePattern.test(msg.text)
  );

  if (existing) {
    parentTs = existing.ts;
  } else {
    // ステップ3: なければ親メッセージを投稿
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
      return res.status(500).json({ error: 'Failed to post parent message' });
    }

    parentTs = parentJson.ts;
  }

  // ステップ4: 日報をスレッド返信として投稿
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
    return res.status(500).json({ error: 'Failed to post daily report' });
  }

  return res.status(200).json({ success: true });
}
