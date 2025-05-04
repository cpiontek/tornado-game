// netlify/functions/generate-questions.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    // parse topic & count from POST body
    const { topic, count } = JSON.parse(event.body);
    if (!topic || !count) {
      return { statusCode: 400, body: 'Missing topic or count' };
    }

    // call OpenAI
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Generate ${count} short trivia questions and answers about "${topic}". Return as blocks separated by blank lines: question on one line, answer on next.`
        }],
        temperature: 0.7
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      return { statusCode: resp.status, body: err };
    }
    const { choices } = await resp.json();
    return {
      statusCode: 200,
      body: choices[0].message.content
    };
  } catch (e) {
    return { statusCode: 500, body: e.toString() };
  }
};
