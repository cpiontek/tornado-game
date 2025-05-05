const { Configuration, OpenAIApi } = require("openai");

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

exports.handler = async function(event, context) {
  try {
    const params = event.queryStringParameters || {};
    const topic = params.topic || "";
    const count = parseInt(params.count, 10) || 10;

    const prompt = `
Generate ${count} simple trivia questions and answers about "${topic}".
Return them as a JSON array of objects like:
[
  { "question": "…", "answer": "…" },
  { "question": "…", "answer": "…" }
]
No extra commentary, just valid JSON.
`;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt.trim() }],
      temperature: 0.7,
    });

    const reply = completion.data.choices[0].message.content;
    let items = [];

    try {
      items = JSON.parse(reply);
    } catch (parseErr) {
      const jsonMatch = reply.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      } else {
        throw parseErr;
      }
    }

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
