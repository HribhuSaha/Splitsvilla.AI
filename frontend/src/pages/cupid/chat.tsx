import { useRef, useEffect, useState, useCallback } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useCupidMatches, useCupidMessages, useGetCupidAuthUser } from "@/lib/cupid/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Clock, Lock, ShieldCheck } from "lucide-react";
import { formatTimeRemaining } from "@/lib/cupid/utils";
import { cn } from "@/lib/utils";
import { getOrCreateKeyPair, getStoredPrivateKey } from "@/lib/cupid/keystore";
import { encryptMessage, decryptMessage, importPublicKeyFromJwk } from "@/lib/cupid/crypto";

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty")
});

interface DecryptedMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string | null;
  displayText: string;
  isEncrypted: boolean;
  decryptFailed?: boolean;
  createdAt: string;
}

export default function CupidChat() {
  const [, params] = useRoute("/cupid/matches/:id");
  const matchId = params?.id || "";
  const [, setLocation] = useLocation();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: authData } = useGetCupidAuthUser();
  const myId = authData?.user?.id;

  const { data: matches } = useCupidMatches(!!myId);
  const match = matches?.find(m => m.id === matchId);

  const { data: rawMessages = [], isLoading: isLoadingMessages } = useCupidMessages(matchId);

  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
  const [e2eeReady, setE2eeReady] = useState(false);
  const [e2eeError, setE2eeError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const privateKeyRef = useRef<CryptoKey | null>(null);
  const recipientPublicKeyRef = useRef<CryptoKey | null>(null);
  const myPublicKeyRef = useRef<CryptoKey | null>(null);

  const form = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: "" }
  });

  const initializeE2EE = useCallback(async () => {
    if (!myId || !match) return;
    try {
      const { privateKey, publicKey, publicKeyJwk, isNew } = await getOrCreateKeyPair(myId);
      privateKeyRef.current = privateKey;
      myPublicKeyRef.current = publicKey;

      // Always upload public key
      fetch(`/api/cupid/keys/public-key`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ publicKey: publicKeyJwk }),
      });

      const recipientId = match.otherProfile?.userId;
      if (recipientId) {
        const resp = await fetch(`/api/cupid/keys/public-key/${recipientId}`, { credentials: "include" });
        if (resp.ok) {
          const data = await resp.json();
          recipientPublicKeyRef.current = await importPublicKeyFromJwk(data.publicKey);
        }
      }

      setE2eeReady(true);
    } catch (err) {
      console.error("E2EE init error:", err);
      setE2eeError("Could not initialize encryption. Messages will be unencrypted.");
      setE2eeReady(true);
    }
  }, [myId, match]);

  useEffect(() => {
    if (myId && match && !e2eeReady) {
      initializeE2EE();
    }
  }, [myId, match, e2eeReady, initializeE2EE]);

  useEffect(() => {
    if (!myId || rawMessages.length === 0) {
      setDecryptedMessages(rawMessages.map(m => ({
        ...m,
        displayText: m.content ?? "[encrypted]",
        isEncrypted: !m.content,
        createdAt: m.createdAt,
      })));
      return;
    }

    const decryptAll = async () => {
      const privateKey = privateKeyRef.current ?? await getStoredPrivateKey(myId);
      const results: DecryptedMessage[] = await Promise.all(
        rawMessages.map(async (msg) => {
          if (!msg.encryptedContent || !msg.iv || !msg.encryptedKeyForSender || !msg.encryptedKeyForRecipient) {
            return { ...msg, displayText: msg.content ?? "[message]", isEncrypted: false, createdAt: msg.createdAt };
          }
          if (!privateKey) {
            return { ...msg, displayText: "[🔐 Encrypted — open on original device]", isEncrypted: true, decryptFailed: true, createdAt: msg.createdAt };
          }
          try {
            const isSender = msg.senderId === myId;
            const plaintext = await decryptMessage(
              { encryptedContent: msg.encryptedContent, iv: msg.iv, encryptedKeyForSender: msg.encryptedKeyForSender, encryptedKeyForRecipient: msg.encryptedKeyForRecipient },
              privateKey, isSender
            );
            return { ...msg, displayText: plaintext, isEncrypted: true, createdAt: msg.createdAt };
          } catch {
            return { ...msg, displayText: "[🔐 Could not decrypt]", isEncrypted: true, decryptFailed: true, createdAt: msg.createdAt };
          }
        })
      );
      setDecryptedMessages(results);
    };

    decryptAll();
  }, [rawMessages, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [decryptedMessages.length]);

  if (!match) {
    if (matches && matches.length > 0) {
      setLocation("/cupid/matches");
    }
    return <div className="flex-1 bg-background" />;
  }

  const handleSend = async (data: { content: string }) => {
    if (!match.canMessage || isSending) return;
    setIsSending(true);
    form.reset();

    try {
      if (myPublicKeyRef.current && recipientPublicKeyRef.current && privateKeyRef.current) {
        const encrypted = await encryptMessage(data.content, myPublicKeyRef.current, recipientPublicKeyRef.current);
        await fetch(`/api/cupid/matches/${matchId}/messages`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify(encrypted),
        });
      } else {
        await fetch(`/api/cupid/matches/${matchId}/messages`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ content: data.content }),
        });
      }
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const timer = formatTimeRemaining(match.messageDeadline);
  const canEncrypt = !!(myPublicKeyRef.current && recipientPublicKeyRef.current);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-10 rounded-t-xl">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href="/cupid/matches" className="p-2 -ml-2 rounded-full hover:bg-muted text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>

          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
            {match.otherProfile?.photoUrl ? (
              <img src={match.otherProfile.photoUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {match.otherProfile?.name[0] ?? "?"}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground leading-tight truncate">{match.otherProfile?.name ?? "Unknown"}</h2>
            <div className="flex items-center gap-1.5">
              {canEncrypt ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3" /> End-to-end encrypted
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Setting up encryption...
                </span>
              )}
              {match.womenMustMessageFirst && !match.canMessage && timer && (
                <span className="text-xs font-semibold text-primary flex items-center gap-1 ml-2">
                  <Clock className="w-3 h-3" /> {timer}
                </span>
              )}
            </div>
          </div>
        </div>

        {e2eeError && (
          <div className="px-4 pb-2 text-xs text-amber-400">{e2eeError}</div>
        )}
      </div>

      {/* E2EE notice */}
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <p className="text-xs text-emerald-400">
          Messages are end-to-end encrypted. Only you and {match.otherProfile?.name ?? "them"} can read them.
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-3">
        {isLoadingMessages ? (
          <div className="text-center text-sm text-muted-foreground mt-10">Loading messages...</div>
        ) : decryptedMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-6 border-4 border-primary/30 shadow-xl">
              {match.otherProfile?.photoUrl ? (
                <img src={match.otherProfile.photoUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
                  {match.otherProfile?.name[0] ?? "?"}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">You matched with {match.otherProfile?.name ?? "someone"}!</h3>

            {!match.canMessage ? (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl text-primary mt-4">
                <p className="font-semibold text-sm">Waiting for them to make the first move.</p>
                {timer && <p className="text-xs mt-1 opacity-80">{timer} remaining</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Send a message to start the conversation. It'll be fully encrypted.
              </p>
            )}
          </div>
        ) : (
          <>
            {decryptedMessages.map((msg, i) => {
              const isMine = msg.senderId === myId;
              const showAvatar = !isMine && (i === decryptedMessages.length - 1 || decryptedMessages[i + 1]?.senderId !== msg.senderId);

              return (
                <div key={msg.id} className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
                  <div className="flex items-end gap-2 max-w-[75%]">
                    {!isMine && (
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-muted">
                        {showAvatar && match.otherProfile?.photoUrl ? (
                          <img src={match.otherProfile.photoUrl} className="w-full h-full object-cover" />
                        ) : showAvatar ? (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {match.otherProfile?.name[0] ?? "?"}
                          </div>
                        ) : <div className="w-6" />}
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <div className={cn(
                        "px-4 py-3 text-[15px] shadow-sm",
                        isMine
                          ? "bg-gradient-to-br from-primary to-pink-700 text-white rounded-2xl rounded-br-sm"
                          : "bg-card border border-white/10 text-foreground rounded-2xl rounded-bl-sm",
                        msg.decryptFailed && "opacity-60 italic"
                      )}>
                        {msg.displayText}
                      </div>
                      {msg.isEncrypted && !msg.decryptFailed && (
                        <div className={cn("flex items-center gap-1 text-[10px] text-emerald-400/70", isMine ? "justify-end" : "justify-start")}>
                          <Lock className="w-2.5 h-2.5" /> encrypted
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-white/5">
        <form
          onSubmit={form.handleSubmit(handleSend)}
          className="flex items-center gap-3 relative max-w-2xl mx-auto"
        >
          <Input
            {...form.register("content")}
            placeholder={match.canMessage ? (canEncrypt ? "Type an encrypted message..." : "Type a message...") : "Waiting for them to message..."}
            className="h-12 rounded-full pl-5 pr-14 bg-background border-white/10 focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={!match.canMessage || isSending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!match.canMessage || isSending || !form.watch("content").trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-md disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        {canEncrypt && (
          <p className="text-center text-[11px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400/70">E2EE active</span> — your private key never leaves this device
          </p>
        )}
      </div>
    </div>
  );
}
