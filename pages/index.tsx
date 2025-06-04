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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 10; hour <= 24; hour++) {
      for (const min of [0, 30]) {
        if (hour === 24 && min > 0) continue;
        const hh = String(hour).padStart(2, "0");
        const mm = String(min).padStart(2, "0");
        options.push(`${hh}:${mm}`);
      }
    }
    return options;
  };

  const handleSubmit = async () => {
    if (form.endTime <= form.startTime) {
      alert("終了時刻は開始時刻より後にしてください。");
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
        dateLabel: form.date,
        text: message,
      }),
    });

    const result = await res.json();
    alert(result.success ? "✅ 送信完了！" : `❌ 送信失敗：${result.error}`);
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem" }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        padding: "2rem"
      }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center" }}>
          📋 日報入力フォーム
        </h1>

        {/* 日付 */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>📅 日付</label>
          <input
            name="date"
            value={form.date}
            readOnly
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "0.95rem"
            }}
          />
        </div>

        {/* 勤務時間 */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>🕒 本日の勤務時間</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select name="startTime" value={form.startTime} onChange={handleChange} style={{ flex: 1, padding: "0.5rem" }}>
              <option value="">開始</option>
              {generateTimeOptions().map((opt) => (
                <option key={`start-${opt}`} value={opt}>{opt}</option>
              ))}
            </select>
            <span style={{ lineHeight: "2.5rem" }}>〜</span>
            <select name="endTime" value={form.endTime} onChange={handleChange} style={{ flex: 1, padding: "0.5rem" }}>
              <option value="">終了</option>
              {generateTimeOptions().map((opt) => (
                <option key={`end-${opt}`} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 名前 */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>名前</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "0.95rem"
            }}
          />
        </div>

        {/* テキストエリア一覧 */}
        {[
          ["✅ 今日の実績", "achievements"],
          ["📈 成果・進捗状況", "progress"],
          ["💡 今日の学び・気づき", "learning"],
          ["⚠️ 改善点", "improvements"],
          ["🚀 次回の目標・質問", "nextGoals"],
        ].map(([label, name]) => (
          <div key={name} style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>{label}</label>
            <textarea
              name={name}
              value={form[name as keyof typeof form]}
              onChange={handleChange}
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "0.95rem"
              }}
            />
          </div>
        ))}

        {/* Submit */}
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
            marginTop: "1rem"
          }}
        >
          🚀 Slackに送信
        </button>
      </div>
    </div>
  );
}
