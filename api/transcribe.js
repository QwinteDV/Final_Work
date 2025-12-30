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
    if (!process.env.AIMLAPI_KEY) {
      return new Response(JSON.stringify({ 
        error: 'AIML API key not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile) {
      return new Response(JSON.stringify({ 
        error: 'No audio file provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'nl',
    });

    return new Response(JSON.stringify({ 
      text: transcription.text 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Transcription failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}