const { Configuration, OpenAIApi } = require("openai");

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

exports.handler = async function(event) {
  try {
    const params = event.queryStringParameters || {};
    const topic = params.topic || "General Knowledge";
    const count = parseInt(params.count) || 10;

    const prompt = `
Generate ${count} short trivia questions and answers about "${topic}".
Return as a JSON array of objects like:
[
  { "question": "…", "answer": "…" },
  { "question": "…", "answer": "…" }
]
Only return valid JSON — no commentary.
`;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt.trim() }],
      temperature: 0.7,
    });

    const content = completion.data.choices[0].message.content;
    const match = content.match(/\[[\s\S]+\]/);
    const json = match ? JSON.parse(match[0]) : [];

    return {
      statusCode: 200,
      body: JSON.stringify({ data: json }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Something went wrong." }),
    };
  }
};
