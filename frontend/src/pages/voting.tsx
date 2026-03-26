import { useState } from "react";
import { useListVotes, useCastVote, useListContestants } from "@/lib/api-client-react/src/index";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShieldBan, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Voting() {
  const { data: votes = [] } = useListVotes();
  const { data: contestants = [] } = useListContestants();
  const voteMutation = useCastVote();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [voter, setVoter] = useState<string>("");
  const [nominee, setNominee] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [round, setRound] = useState<string>("1");

  const activeContestants = contestants.filter(c => c.status === "active");

  const handleVote = () => {
    if (!voter || !nominee || voter === nominee) {
      toast({ title: "Invalid Vote", description: "Please select valid, different contestants.", variant: "destructive" });
      return;
    }
    
    voteMutation.mutate({ 
      data: { 
        voterContestantId: parseInt(voter), 
        nominatedContestantId: parseInt(nominee),
        round: parseInt(round),
        reason 
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/votes"] });
        setVoter(""); setNominee(""); setReason("");
        toast({ title: "Vote Cast", description: "The dumping ground awaits." });
      }
    });
  };

  // Group votes by round
  const votesByRound = votes.reduce((acc, vote) => {
    if (!acc[vote.round]) acc[vote.round] = [];
    acc[vote.round].push(vote);
    return acc;
  }, {} as Record<number, typeof votes>);

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <ShieldBan className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">The Dumping Ground</h1>
        <p className="text-destructive/80 text-lg">Cast votes to eliminate the weakest links. Nobody is safe.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 glass-panel p-6 border-destructive/30 h-fit sticky top-8">
          <h2 className="text-2xl font-serif text-destructive mb-6 flex items-center gap-2"><Flame className="w-5 h-5"/> Cast Vote</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Round</label>
              <Input type="number" min="1" value={round} onChange={e => setRound(e.target.value)} className="bg-background/50 border-white/10" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Voter</label>
              <Select value={voter} onValueChange={setVoter}>
                <SelectTrigger className="bg-background/50 border-white/10"><SelectValue placeholder="Who is voting?" /></SelectTrigger>
                <SelectContent className="glass-panel">
                  {activeContestants.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-destructive">Nominee (To Dump)</label>
              <Select value={nominee} onValueChange={setNominee}>
                <SelectTrigger className="bg-destructive/10 border-destructive/30 text-destructive"><SelectValue placeholder="Who to dump?" /></SelectTrigger>
                <SelectContent className="glass-panel border-destructive/30">
                  {activeContestants.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Reason (Optional)</label>
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Why?" className="bg-background/50 border-white/10" />
            </div>

            <Button onClick={handleVote} disabled={voteMutation.isPending || !voter || !nominee} className="w-full mt-4 bg-destructive hover:bg-destructive/90 text-white h-12 text-lg font-bold">
              {voteMutation.isPending ? "Casting..." : "Lock In Vote"}
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          {Object.entries(votesByRound).sort(([a],[b]) => Number(b) - Number(a)).map(([r, roundVotes]) => (
            <motion.div key={r} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
              <h3 className="text-xl font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center">
                <span className="bg-white/10 h-px flex-1 mr-4"></span>
                Round {r}
                <span className="bg-white/10 h-px flex-1 ml-4"></span>
              </h3>
              
              <div className="space-y-3">
                {roundVotes.map(vote => (
                  <Card key={vote.id} className="glass-panel p-4 border-l-4 border-l-destructive border-t-0 border-r-0 border-b-0 rounded-r-xl rounded-l-sm bg-gradient-to-r from-destructive/10 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col text-center min-w-[100px]">
                        <span className="text-xs text-white/40 uppercase">Voter</span>
                        <span className="font-bold text-white">{vote.voterName}</span>
                      </div>
                      <ShieldBan className="w-5 h-5 text-destructive/50" />
                      <div className="flex flex-col text-center min-w-[100px]">
                        <span className="text-xs text-destructive/60 uppercase">Nominated</span>
                        <span className="font-bold text-destructive text-lg">{vote.nominatedName}</span>
                      </div>
                    </div>
                    
                    {vote.reason && (
                      <div className="flex-1 text-sm text-white/70 italic sm:border-l border-white/10 sm:pl-4">
                        "{vote.reason}"
                      </div>
                    )}
                    
                    <span className="text-xs font-mono text-white/30 shrink-0">
                      {format(new Date(vote.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </Card>
                ))}
              </div>
            </motion.div>
          ))}
          {votes.length === 0 && (
            <div className="text-center py-20 text-white/40 glass-panel rounded-xl">
              No votes cast yet. The dumping ground is empty.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
