import { useState, useRef, useEffect } from "react";
import { useListGeminiConversations, useCreateGeminiConversation, useGetGeminiConversation } from "@/lib/api-client-react/src/index";
import { useGeminiStream } from "@/hooks/use-gemini-stream";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Plus, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function OracleChat() {
  const { data: conversations = [], refetch: refetchConvos } = useListGeminiConversations();
  const createConvo = useCreateGeminiConversation();
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages when switching convo
  const { data: activeConvoData } = useGetGeminiConversation(activeId || 0, {
    query: { enabled: !!activeId }
  });

  const { messages, isStreaming, sendMessage, setMessages } = useGeminiStream(activeId || 0);

  // Sync initial messages
  useEffect(() => {
    if (activeConvoData?.messages) {
      setMessages(activeConvoData.messages.map(m => ({ role: m.role as "user"|"assistant", content: m.content })));
    }
  }, [activeConvoData, setMessages]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreate = () => {
    createConvo.mutate({ data: { title: "Seeker's Session " + new Date().toLocaleTimeString() } }, {
      onSuccess: (res) => {
        refetchConvos();
        setActiveId(res.id);
      }
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeId || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar for chat history */}
      <Card className="w-64 shrink-0 glass-panel border-white/5 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-white/5">
          <Button onClick={handleCreate} disabled={createConvo.isPending} className="w-full bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30">
            <Plus className="w-4 h-4 mr-2" /> New Session
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${activeId === c.id ? 'bg-white/10 text-white font-medium' : 'text-white/50 hover:bg-white/5'}`}
            >
              <MessageCircle className="w-3 h-3 inline mr-2 opacity-50" />
              {c.title}
            </button>
          ))}
        </div>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 glass-panel border-accent/20 flex flex-col overflow-hidden relative">
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
            <Sparkles className="w-16 h-16 text-accent mb-4 opacity-50 animate-pulse" />
            <h2 className="text-2xl font-serif text-white mb-2">The Oracle Awaits</h2>
            <p className="text-white/50 max-w-md mb-6">Create a new session to consult the mystical AI entity about relationships, the future, and villa drama.</p>
            <Button onClick={handleCreate} className="bg-accent text-accent-foreground hover:bg-accent/90 px-8">
              Approach the Oracle
            </Button>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
              <img src={`${import.meta.env.BASE_URL}images/oracle-crystal.png`} alt="BG" className="w-full h-full object-cover mix-blend-screen" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 z-10 relative">
              {messages.length === 0 && (
                <div className="text-center py-10 text-accent/50 italic font-serif">
                  "Speak your mind, seeker..."
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-sm shadow-lg shadow-primary/20' 
                      : 'bg-black/60 border border-accent/30 text-white/90 rounded-tl-sm backdrop-blur-md font-serif text-lg leading-relaxed shadow-lg shadow-accent/10'
                  }`}>
                    {m.role === 'assistant' && <Sparkles className="w-4 h-4 text-accent mb-2 inline-block mr-2 -mt-1" />}
                    {m.content || (isStreaming && i === messages.length - 1 ? <span className="animate-pulse">...</span> : "")}
                  </div>
                </motion.div>
              ))}
              <div ref={endOfMessagesRef} />
            </div>

            <div className="p-4 border-t border-white/5 bg-background/50 backdrop-blur-xl z-10">
              <form onSubmit={handleSend} className="flex gap-2 relative">
                <Input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder="Ask the Oracle..." 
                  disabled={isStreaming}
                  className="flex-1 bg-white/5 border-white/10 h-12 text-lg rounded-xl pl-4 pr-12 focus-visible:ring-accent"
                />
                <Button type="submit" disabled={isStreaming || !input.trim()} size="icon" className="absolute right-1 top-1 h-10 w-10 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg">
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
