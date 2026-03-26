import { useState } from "react";
import { useListContestants, useAnalyzeCompatibility, useOraclePrediction, useMlCompatibilityScore } from "@/lib/api-client-react/src/index";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, BrainCircuit, Eye, Activity, Star, ThumbsUp, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Compatibility() {
  const { data: contestants = [] } = useListContestants();
  const analyzeMutation = useAnalyzeCompatibility();
  const oracleMutation = useOraclePrediction();
  const mlMutation = useMlCompatibilityScore();

  const [c1, setC1] = useState<string>("");
  const [c2, setC2] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'ai'|'ml'|'oracle'>('ai');

  const activeContestants = contestants.filter(c => c.status === "active");

  const runAllTests = () => {
    if (!c1 || !c2 || c1 === c2) return;
    const payload = { data: { contestant1Id: parseInt(c1), contestant2Id: parseInt(c2) } };
    
    // Run them independently
    analyzeMutation.mutate(payload);
    mlMutation.mutate(payload);
    oracleMutation.mutate(payload);
  };

  const isTesting = analyzeMutation.isPending || oracleMutation.isPending || mlMutation.isPending;
  const hasResults = analyzeMutation.isSuccess || oracleMutation.isSuccess || mlMutation.isSuccess;

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">Compatibility Lab</h1>
        <p className="text-muted-foreground text-lg">Harness the power of AI, Machine Learning, and the Mystical Oracle to determine if two hearts truly align.</p>
      </div>

      <Card className="glass-panel p-6 border-white/10 max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-full">
            <label className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2 block">Subject Alpha</label>
            <Select value={c1} onValueChange={setC1}>
              <SelectTrigger className="bg-background/80 h-14 border-white/10 text-lg"><SelectValue placeholder="Select contestant" /></SelectTrigger>
              <SelectContent className="glass-panel">
                {activeContestants.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="shrink-0 p-4 rounded-full bg-white/5 border border-white/10">
            <Activity className="w-6 h-6 text-primary" />
          </div>

          <div className="w-full">
            <label className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2 block">Subject Beta</label>
            <Select value={c2} onValueChange={setC2}>
              <SelectTrigger className="bg-background/80 h-14 border-white/10 text-lg"><SelectValue placeholder="Select contestant" /></SelectTrigger>
              <SelectContent className="glass-panel">
                {activeContestants.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={runAllTests} 
          disabled={isTesting || !c1 || !c2 || c1 === c2} 
          className="w-full mt-8 h-14 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/20 border-0"
        >
          {isTesting ? "Analyzing Data Streams..." : "Run Compatibility Matrix"}
        </Button>
      </Card>

      <AnimatePresence mode="wait">
        {hasResults && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 mb-6">
              <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-primary text-white shadow-md' : 'text-white/50 hover:text-white/80'}`}>
                <BrainCircuit className="w-4 h-4" /> Deep AI Analysis
              </button>
              <button onClick={() => setActiveTab('ml')} className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'ml' ? 'bg-secondary text-white shadow-md' : 'text-white/50 hover:text-white/80'}`}>
                <Activity className="w-4 h-4" /> ML Scoring
              </button>
              <button onClick={() => setActiveTab('oracle')} className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'oracle' ? 'bg-accent text-accent-foreground shadow-md' : 'text-white/50 hover:text-white/80'}`}>
                <Eye className="w-4 h-4" /> The Oracle
              </button>
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'ai' && analyzeMutation.data && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="glass-panel p-6 border-primary/30 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-white/60 mb-2 uppercase tracking-widest">Overall</p>
                      <div className="text-6xl font-serif font-bold text-glow-primary text-white">{analyzeMutation.data.overallScore}%</div>
                    </Card>
                    <div className="md:col-span-3 grid grid-cols-3 gap-4">
                      {[
                        { label: "Personality", val: analyzeMutation.data.personalityMatch, color: "text-blue-400" },
                        { label: "Interests", val: analyzeMutation.data.interestMatch, color: "text-green-400" },
                        { label: "Zodiac", val: analyzeMutation.data.zodiacMatch, color: "text-purple-400" }
                      ].map(metric => (
                        <Card key={metric.label} className="glass-panel p-4 flex flex-col justify-center border-white/5">
                          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{metric.label}</p>
                          <div className={`text-3xl font-mono font-bold ${metric.color}`}>{metric.val}%</div>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="glass-panel p-6 border-green-500/20">
                      <h3 className="flex items-center gap-2 text-green-400 font-serif text-xl mb-4"><ThumbsUp className="w-5 h-5"/> Strengths</h3>
                      <ul className="space-y-3">
                        {analyzeMutation.data.strengths.map((s,i) => <li key={i} className="text-white/80 text-sm leading-relaxed">{s}</li>)}
                      </ul>
                    </Card>
                    <Card className="glass-panel p-6 border-red-500/20">
                      <h3 className="flex items-center gap-2 text-red-400 font-serif text-xl mb-4"><AlertTriangle className="w-5 h-5"/> Challenges</h3>
                      <ul className="space-y-3">
                        {analyzeMutation.data.challenges.map((s,i) => <li key={i} className="text-white/80 text-sm leading-relaxed">{s}</li>)}
                      </ul>
                    </Card>
                  </div>
                  <Card className="glass-panel p-6 border-white/10">
                    <p className="text-lg leading-relaxed text-white/90 italic border-l-4 border-primary pl-4">{analyzeMutation.data.analysis}</p>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'ml' && mlMutation.data && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <Card className="glass-panel p-8 text-center border-secondary/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-secondary/5" />
                    <h2 className="relative z-10 text-xl text-secondary mb-2 uppercase tracking-widest font-bold">Algorithmic Match Rating</h2>
                    <div className="relative z-10 text-8xl font-serif font-bold text-white mb-4 text-glow-secondary">{mlMutation.data.score.toFixed(1)}</div>
                    <span className="relative z-10 px-4 py-1.5 rounded-full border border-secondary text-secondary font-bold uppercase tracking-widest bg-secondary/10">
                      {mlMutation.data.label} Match
                    </span>
                  </Card>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(mlMutation.data.breakdown).map(([key, val]) => (
                      <Card key={key} className="glass-panel p-5 border-white/5 hover:border-secondary/30 transition-colors">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <div className="w-full bg-black/50 rounded-full h-2 mb-2">
                          <div className="bg-secondary h-2 rounded-full" style={{ width: `${val}%` }} />
                        </div>
                        <p className="text-right text-sm font-mono text-secondary">{val}%</p>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'oracle' && oracleMutation.data && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-[500px] rounded-2xl overflow-hidden glass-panel border-accent/30 flex items-center justify-center p-8">
                  <div className="absolute inset-0 z-0">
                    <img src={`${import.meta.env.BASE_URL}images/oracle-crystal.png`} alt="Oracle" className="w-full h-full object-cover opacity-30 mix-blend-screen" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                  </div>
                  <div className="relative z-10 text-center max-w-2xl">
                    <Sparkles className="w-12 h-12 text-accent mx-auto mb-6 animate-pulse" />
                    <span className="px-4 py-1.5 rounded-full border border-accent text-accent font-bold uppercase tracking-widest bg-accent/10 mb-6 inline-block">
                      {oracleMutation.data.verdict.replace('_', ' ')}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-8 leading-snug text-glow-accent">"{oracleMutation.data.mysticalMessage}"</h2>
                    <div className="space-y-4 text-left bg-black/40 p-6 rounded-xl border border-white/10 backdrop-blur-md">
                      <div>
                        <p className="text-xs text-accent uppercase tracking-wider mb-1 font-bold">The Vision</p>
                        <p className="text-white/90">{oracleMutation.data.prediction}</p>
                      </div>
                      <div>
                        <p className="text-xs text-accent uppercase tracking-wider mb-1 font-bold">Divine Advice</p>
                        <p className="text-white/90 italic">{oracleMutation.data.advice}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
