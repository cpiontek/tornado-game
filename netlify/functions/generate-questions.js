const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

exports.handler = async function(event) {
  try {
    const params = event.queryStringParameters || {};
    const topic = params.topic || "";
    const count = parseInt(params.count,10) || 10;
    const prompt = `Generate ${count} trivia Q&A pairs about "${topic}". Return as JSON array of objects: [{"question":"…","answer":"…"},…]. No extra text.`;
    const resp = await openai.createChatCompletion({
      model:"gpt-3.5-turbo",
      messages:[{role:"user",content:prompt}],
      temperature:0.7
    });
    let data = resp.data.choices[0].message.content;
    // attempt to pull JSON
    const match = data.match(/\[\s*{[\s\S]*}\s*\]/);
    const items = match ? JSON.parse(match[0]) : JSON.parse(data);
    return { statusCode:200, body: JSON.stringify({ data: items }) };
  } catch(err) {
    console.error(err);
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
};
