// ── netlify/functions/generate-questions.js ──
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,   // ← make sure your NETLIFY env var is named OPENAI_API_KEY
});

exports.handler = async function(event) {
  try {
    // pull topic & count off the query string
    const qs    = event.queryStringParameters || {};
    const topic = qs.topic || "";
    const count = parseInt(qs.count, 10) || 10;

    // build a tight prompt
    const prompt = `
Generate ${count} simple trivia questions and answers about "${topic}".
Return them as a JSON array of objects like:
[
  { "question": "...", "answer": "..." },
  { "question": "...", "answer": "..." }
]
No extra text, just valid JSON.
`.trim();

    // call the Chat API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content || "";
    let items = [];

    // try a straight parse, otherwise pull out the JSON substring
    try {
      items = JSON.parse(reply);
    } catch {
      const m = reply.match(/\[[\s\S]*\]/);
      if (m) items = JSON.parse(m[0]);
      else throw new Error("Could not parse AI response as JSON.");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: items }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Something went wrong" }),
    };
  }
};
