import { useGetLeaderboard } from "@/lib/api-client-react/src/index";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: leaderboard = [], isLoading } = useGetLeaderboard();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center mb-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accent/20 blur-[50px] rounded-full pointer-events-none" />
        <Trophy className="w-16 h-16 text-accent mx-auto mb-4 relative z-10" />
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-2 relative z-10">Villa Leaderboard</h1>
        <p className="text-accent/80 text-lg relative z-10">The strongest connections, mathematically proven.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((entry, index) => {
            const isTop3 = index < 3;
            const rankColor = index === 0 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" : 
                              index === 1 ? "text-gray-300 bg-gray-300/10 border-gray-300/30" : 
                              index === 2 ? "text-amber-600 bg-amber-600/10 border-amber-600/30" : 
                              "text-white/50 bg-white/5 border-white/10";
            
            return (
              <motion.div
                key={entry.splitId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`glass-panel p-4 sm:p-6 flex items-center gap-4 sm:gap-6 relative overflow-hidden transition-all hover:scale-[1.01] ${isTop3 ? 'border-accent/30' : 'border-white/5'}`}>
                  {index === 0 && <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none" />}
                  
                  <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border text-xl font-bold font-serif ${rankColor}`}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 z-10">
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        {entry.contestant1Name} <span className="text-primary text-sm">&amp;</span> {entry.contestant2Name}
                      </h3>
                      <p className="text-sm text-white/50 flex items-center gap-1 mt-1">
                        {isTop3 && <Star className="w-3 h-3 text-accent fill-accent" />}
                        {entry.label} Match
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-mono font-bold text-accent">{entry.score.toFixed(1)}</div>
                      <div className="text-xs uppercase tracking-widest text-white/40">Score</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
          {leaderboard.length === 0 && (
             <div className="py-20 text-center text-white/40 glass-panel rounded-xl">
               Not enough data to rank couples. Form connections and run compatibility tests.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
