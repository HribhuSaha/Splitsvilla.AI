import { useState } from "react";
import { useListSplits, useCreateSplit, useDeleteSplit, useListContestants } from "@/lib/api-client-react/src/index";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, HeartCrack, Zap, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Splits() {
  const { data: splits = [], isLoading: loadingSplits } = useListSplits();
  const { data: contestants = [] } = useListContestants();
  const createMutation = useCreateSplit();
  const deleteMutation = useDeleteSplit();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [c1, setC1] = useState<string>("");
  const [c2, setC2] = useState<string>("");

  const activeContestants = contestants.filter(c => c.status === "active");

  const handleCreateSplit = () => {
    if (!c1 || !c2) return;
    if (c1 === c2) {
      toast({ title: "Invalid", description: "Cannot pair a contestant with themselves.", variant: "destructive" });
      return;
    }
    createMutation.mutate({ data: { contestant1Id: parseInt(c1), contestant2Id: parseInt(c2) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/splits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
        setIsDialogOpen(false);
        setC1(""); setC2("");
        toast({ title: "Split Formed", description: "A new connection has blossomed." });
      },
      onError: (err) => toast({ title: "Failed to form split", description: err.message, variant: "destructive" })
    });
  };

  const handleBreakSplit = (id: number) => {
    if(confirm("Are you sure you want to break this split? Hearts will be broken.")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/splits"] });
          queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
          toast({ title: "Split Broken", description: "The connection is severed." });
        }
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-serif text-white">Villa Connections</h1>
          <p className="text-muted-foreground mt-1">Track the evolving relationships and splits.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20">
              <Heart className="w-4 h-4 mr-2" /> Form New Split
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-primary/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">Form a Connection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Select Contestant 1</label>
                <Select value={c1} onValueChange={setC1}>
                  <SelectTrigger className="bg-background/50 border-white/10"><SelectValue placeholder="Choose someone..." /></SelectTrigger>
                  <SelectContent className="glass-panel">
                    {activeContestants.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-center py-2"><Heart className="w-6 h-6 text-primary animate-pulse" /></div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Select Contestant 2</label>
                <Select value={c2} onValueChange={setC2}>
                  <SelectTrigger className="bg-background/50 border-white/10"><SelectValue placeholder="Choose their match..." /></SelectTrigger>
                  <SelectContent className="glass-panel">
                    {activeContestants.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSplit} disabled={createMutation.isPending || !c1 || !c2} className="w-full bg-primary hover:bg-primary/90">
                {createMutation.isPending ? "Connecting..." : "Lock in Connection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loadingSplits ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {splits.map((split, i) => (
            <motion.div
              key={split.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`p-6 glass-panel border-t-4 transition-all duration-300 ${
                split.status === 'active' ? 'border-t-primary hover:shadow-xl hover:shadow-primary/10' : 
                split.status === 'winner' ? 'border-t-accent shadow-xl shadow-accent/20' : 
                'border-t-destructive opacity-70 grayscale-[0.5]'
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
                    split.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : 
                    split.status === 'winner' ? 'bg-accent/10 text-accent border-accent/20' : 
                    'bg-destructive/10 text-destructive border-destructive/20'
                  }`}>
                    {split.status}
                  </span>
                  {split.status === 'active' && (
                    <Button variant="ghost" size="sm" onClick={() => handleBreakSplit(split.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2">
                      <HeartCrack className="w-4 h-4 mr-1" /> Break
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="text-center w-[40%]">
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white truncate">{split.contestant1Name}</h3>
                  </div>
                  <div className="relative w-[20%] flex justify-center">
                    {split.status === 'broken' ? 
                      <HeartCrack className="w-8 h-8 text-destructive" /> : 
                      <Heart className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(255,0,100,0.8)] fill-primary/20" />
                    }
                  </div>
                  <div className="text-center w-[40%]">
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white truncate">{split.contestant2Name}</h3>
                  </div>
                </div>

                <div className="bg-background/40 rounded-xl p-4 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60 flex items-center gap-1"><Zap className="w-3 h-3 text-secondary"/> ML Score</span>
                    <span className="font-mono font-bold text-secondary">
                      {split.compatibilityScore ? `${split.compatibilityScore}%` : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60 flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-accent"/> Oracle Status</span>
                    <span className="font-medium text-accent">
                      {split.oraclePrediction ? split.oraclePrediction.replace('_', ' ').toUpperCase() : 'Unverified'}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          {splits.length === 0 && (
             <div className="col-span-full py-12 text-center text-muted-foreground glass-panel rounded-xl">
               No connections formed yet.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
