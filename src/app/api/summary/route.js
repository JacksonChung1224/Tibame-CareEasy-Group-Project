import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { signals, recentLogs, workerObs } = await req.json();
    const apiKey = process.env.Gemini_API_KEY;

    if (!apiKey) {
      console.warn("Gemini_API_KEY is not set.");
      return NextResponse.json({ summary: null, source: "fallback" });
    }

    const payloadText = JSON.stringify({ signals, recentLogs, workerObs });
    const prompt = `你是照護摘要助手。僅根據提供的結構化資料，以台灣繁體中文撰寫一段醫師 30 秒內可讀完的就醫摘要。規則：
1. 只能陳述資料中存在的觀察，禁止推測診斷、禁止新增資料中沒有的事件。
2. 結構：近況一句 → 需優先確認項（引用日期）→ 請醫師留意項。
3. 結尾固定加註：「本摘要為家屬觀察彙整，非醫療診斷。」
4. 全文不超過 150 字。

結構化資料：
${payloadText}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.2, // Keep it focused
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Gemini API returned status: ${response.status}`);
      return NextResponse.json({ summary: null, source: "fallback" });
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      console.warn("No summary generated from Gemini.");
      return NextResponse.json({ summary: null, source: "fallback" });
    }

    return NextResponse.json({ summary: summary.trim(), source: "ai" });
  } catch (error) {
    console.warn("Error generating summary:", error.message);
    return NextResponse.json({ summary: null, source: "fallback" });
  }
}
