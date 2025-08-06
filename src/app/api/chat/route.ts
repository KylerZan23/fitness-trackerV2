// src/app/api/chat/route.ts
import { createClient } from '@/utils/supabase/server';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const { messages, chatId } = await req.json();
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages,
  });

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      const payload = {
        user_id: user.id,
        messages: [...messages, { role: 'assistant', content: completion }],
        title: messages[0].content.substring(0, 100),
      };

      if (chatId) {
        await supabase
          .from('ai_conversations')
          .update({ messages: payload.messages })
          .eq('id', chatId);
      } else {
        await supabase.from('ai_conversations').insert(payload);
      }
    },
  });

  return new StreamingTextResponse(stream);
}
