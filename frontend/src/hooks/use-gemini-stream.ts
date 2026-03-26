import { useState, useRef, useCallback } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useGeminiStream(conversationId: number) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    try {
      setError(null);
      setIsStreaming(true);
      
      // Add user message to UI immediately
      setMessages(prev => [...prev, { role: "user", content }]);
      
      // Add an empty assistant message to append chunks to
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const response = await fetch(`/api/gemini/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
        
        for (const line of lines) {
          try {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;
            
            const data = JSON.parse(dataStr);
            if (data.done) {
              setIsStreaming(false);
              break;
            }
            if (data.content) {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                newMessages[lastIdx] = {
                  ...newMessages[lastIdx],
                  content: newMessages[lastIdx].content + data.content
                };
                return newMessages;
              });
            }
          } catch (e) {
            console.error("Error parsing SSE chunk", e);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsStreaming(false);
    }
  }, [conversationId]);

  return { messages, isStreaming, error, sendMessage, setMessages };
}
