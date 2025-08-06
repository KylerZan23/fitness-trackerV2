// src/app/api/chat/route.ts
import { createClient } from '@/utils/supabase/server';
import { streamText } from 'ai';
import { openai } from 'ai/openai';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, chatId } = await req.json();
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    onFinish: async ({ text: completion }) => {
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

  return result.toDataStreamResponse();
}
