import { loadLocalEnv } from "./script-env.mjs";

loadLocalEnv();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is missing from .env.local or the environment.");
  process.exit(1);
}

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: 'Return ONLY this valid JSON object and nothing else: {"ok":true,"topic":"test"}',
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 128 },
    }),
  },
);

const data = await response.json();
console.log("STATUS:", response.status, response.statusText);
console.log("GEMINI_RAW:", JSON.stringify(data).slice(0, 1000));
console.log("TEXT:", data.candidates?.[0]?.content?.parts?.[0]?.text || "");
