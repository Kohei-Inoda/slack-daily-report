import { useEffect, useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    date: "",
    name: "",
    startTime: "",
    endTime: "",
    achievements: "",
    progress: "",
    learning: "",
    improvements: "",
    nextGoals: "",
  });

  useEffect(() => {
    const today = new Date();
    const formatted = `${today.getMonth() + 1}/${today.getDate()}`;
    setForm((prev) => ({ ...prev, date: formatted }));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // バリデーション：時間順
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      alert("⚠️ 終業時間は始業時間より後に設定してください。");
      return;
    }

    // フィールド未入力チェック（任意で追加）
    if (!form.name || !form.startTime || !form.endTime) {
      alert("⚠️ 名前・勤務時間をすべて入力してください。");
      return;
    }

    const message = `
📅 日付：${form.date}
👤 名前：${form.name}
🕒 本日の勤務時間：${form.startTime}〜${form.endTime}

✅ *今日の実績*
${form.achievements}

📈 *成果・進捗状況*
${form.progress}

💡 *今日の学び・気づき*
${form.learning}

⚠️ *改善点*
${form.improvements}

🚀 *次回の目標・質問*
${form.nextGoals}

----------------------------
    `.trim();

    const res = await fetch("/api/submit-daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: process.env.NEXT_PUBLIC_SLACK_CHANNEL_ID,
        dateLabel: form.date,
        text: message,
      }),
    });

    const result = await res.json();
    alert(result.success ? "✅ 送信完了！" : `❌ 送信失敗：${result.error}`);
  };

  function generateTimeOptions(): string[] {
    const options: string[] = [];
    for (let h = 10; h <= 19; h++) {
      for (const m of [0, 30]) {
        if (h === 19 && m > 0) continue;
        const time = `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
        options.push(time);
      }
    }
    return options;
  }

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem" }}>
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          📋 日報入力フォーム
        </h1>

        {/* 📅 日付 */}
        <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>
                📅 日付
            </label>
            <input
                name="date"
                value={form.date}
                readOnly
                style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "0.95rem",
                }}
            />
            </div>

        {/* 勤務時間（開始〜終了） */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>
            🕒 本日の勤務時間
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              style={{
                flex: 1,
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "0.95rem",
              }}
            >
              <option value="">始業時間</option>
              {generateTimeOptions().map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <span style={{ alignSelf: "center" }}>〜</span>

            <select
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              style={{
                flex: 1,
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "0.95rem",
              }}
            >
              <option value="">終業時間</option>
              {generateTimeOptions()
                .filter((t) => !form.startTime || t > form.startTime)
                .map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* その他の入力フィールド */}
        {[
          ["名前", "name"],
          ["✅ 今日の実績", "achievements", false, true],
          ["📈 成果・進捗状況", "progress", false, true],
          ["💡 今日の学び・気づき", "learning", false, true],
          ["⚠️ 改善点", "improvements", false, true],
          ["🚀 次回の目標・質問", "nextGoals", false, true],
        ].map(([label, name, readonly, isTextarea]) => (
          <div key={name as string} style={{ marginBottom: "1rem" }}>
            <label
              style={{
                fontWeight: "600",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              {label}
            </label>

            {isTextarea ? (
              <textarea
                name={name as string}
                rows={3}
                value={form[name as keyof typeof form]}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "0.95rem",
                }}
              />
            ) : (
              <input
                name={name as string}
                value={form[name as keyof typeof form]}
                onChange={handleChange}
                readOnly={!!readonly}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "0.95rem",
                }}
              />
            )}
          </div>
        ))}

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#2563eb",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            marginTop: "1rem",
          }}
        >
          🚀 Slackに送信
        </button>
      </div>
    </div>
  );
}
