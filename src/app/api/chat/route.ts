import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define custom types for Deepseek response
interface DeepseekDelta extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
  reasoning_content?: string;
}

// Initialize OpenAI client with Deepseek base URL
const openai = new OpenAI({
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: 'https://api.siliconflow.cn/v1',  // Deepseek API endpoint
});

// System prompt to guide the AI's behavior
const SYSTEM_PROMPT = `You are an expert Environmental Law Assistant. Your role is to:
1. Provide accurate information about environmental laws and regulations
2. Explain legal concepts in clear, understandable terms
3. Reference specific laws and regulations when applicable
4. Highlight important legal considerations and compliance requirements
Please be professional, precise, and helpful in your responses.`;

export async function POST(request: Request) {
  try {
    // Extract the message from the request body
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create streaming chat completion
    const stream = await openai.chat.completions.create({
      model: "Pro/deepseek-ai/DeepSeek-R1",  // Deepseek chat model
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,  // Enable streaming
    });

    // Create a readable stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            const reasoningContent = (chunk.choices[0]?.delta as DeepseekDelta)?.reasoning_content || '';
            
            if (content || reasoningContent) {
              // Send the chunk as a Server-Sent Event
              const sseMessage = `data: ${JSON.stringify({
                content,
                reasoning_content: reasoningContent
              })}\n\n`;
              controller.enqueue(encoder.encode(sseMessage));
            }
          }
          // Send a completion message
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return the stream response
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    console.error('Error in chat route:', error);
    
    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: 'API error: ' + error.message },
        { status: error.status || 500 }
      );
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
