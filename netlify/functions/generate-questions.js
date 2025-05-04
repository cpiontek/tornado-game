// netlify/functions/generate-questions.js

const { Configuration, OpenAIApi } = require("openai");

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,    // ← your key comes from an env var
});
const openai = new OpenAIApi(config);

exports.handler = async function(event, context) {
  try {
    // parse query params
    const params = event.queryStringParameters || {};
    const topic = params.topic || "";
    const count = parseInt(params.count, 10) || 10;

    // build a prompt that asks for exactly `count` Q&A pairs
    const prompt = `
Generate ${count} simple trivia questions and answers about "${topic}".
Return them as a JSON array of objects:
[
  { "question": "…", "answer": "…" },
  { "question": "…", "answer": "…" },
  …
]
No extra text, just valid JSON.
`;

    // call OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages:[ { role: "user", content: prompt.trim() } ],
      temperature: 0.7,
    });

    // extract and parse
    const reply = completion.data.choices[0].message.content;
    let items = [];
    try {
      items = JSON.parse(reply);
    } catch(parseErr) {
      // if OpenAI returned text instead of clean JSON, attempt to locate the JSON substring
      const jsonMatch = reply.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      } else {
        throw parseErr;
      }
    }

    // respond
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: items }),
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Something went wrong" }),
    };
  }
};
