import { Link, useLocation } from "wouter";
import { useCupidMatches, useCupidProfile } from "@/lib/cupid/api";
import { formatTimeRemaining } from "@/lib/cupid/utils";
import { Heart, Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function CupidMatches() {
  const [, setLocation] = useLocation();
  
  const { data: myProfile, error: profileError } = useCupidProfile();

  const { data: matches = [], isLoading } = useCupidMatches(!!myProfile);

  // Force re-render every minute for accurate timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(int);
  }, []);

  if (profileError) {
    setLocation("/cupid/profile/setup");
    return null;
  }

  // Separate new matches (no messages) from active conversations
  const newMatches = matches.filter(m => !m.lastMessage);
  const activeChats = matches.filter(m => m.lastMessage);

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-3xl font-bold text-foreground mb-8">💘 Cupid — Matches</h1>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-card/50 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-20">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Heart className="w-8 h-8 text-primary opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No matches yet</h3>
          <p className="text-muted-foreground max-w-[200px]">
            Keep swiping to find your next connection.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* New Matches Row */}
          {newMatches.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 px-1">New Matches</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-2 px-2 no-scrollbar snap-x">
                {newMatches.map((match) => {
                  const timer = formatTimeRemaining(match.messageDeadline);
                  const isUrgent = timer && timer.includes("m") && !timer.includes("h");

                  return (
                    <Link 
                      key={match.id} 
                      href={`/cupid/matches/${match.id}`}
                      className="snap-start shrink-0 group relative"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-card shadow-md relative bg-muted">
                        {match.otherProfile?.photoUrl ? (
                          <img src={match.otherProfile.photoUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                            {match.otherProfile?.name[0] ?? "?"}
                          </div>
                        )}
                        {!match.canMessage && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-center text-xs font-semibold mt-2 text-foreground w-20 truncate">
                        {match.otherProfile?.name ?? "Unknown"}
                      </p>
                      
                      {/* Timer Badge */}
                      {timer && (
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shadow-sm border border-white/10 ${isUrgent ? 'bg-destructive text-white' : 'bg-primary/20 text-primary'}`}>
                          {timer}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversations List */}
          {activeChats.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 px-1">Conversations</h2>
              <div className="flex flex-col gap-3">
                {activeChats.map((match, i) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/cupid/matches/${match.id}`} className="block">
                      <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-card border border-white/5 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                        <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-muted">
                          {match.otherProfile?.photoUrl ? (
                             <img src={match.otherProfile.photoUrl} className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {match.otherProfile?.name[0] ?? "?"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-foreground truncate pr-2">{match.otherProfile?.name ?? "Unknown"}</h3>
                            {match.lastMessage && (
                              <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                {new Date(match.lastMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate font-medium">
                            {match.lastMessage?.content || "Tap to chat"}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
