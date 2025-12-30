import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AIMLAPI_KEY,
  baseURL: 'https://api.aimlapi.com/v1'
});

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { message } = await req.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!process.env.AIMLAPI_KEY) {
      return new Response(JSON.stringify({ 
        error: 'AIML API key not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Je bent een behulpzame AI assistent die antwoord geeft in het Nederlands. Wees kort en duidelijk.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: aiResponse 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'AI response failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}