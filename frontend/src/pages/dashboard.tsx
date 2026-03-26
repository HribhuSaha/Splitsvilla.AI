import { useListContestants, useListSplits, useListTasks, useListEvents } from "@/lib/api-client-react/src/index";
import { Card } from "@/components/ui/card";
import { Users, Heart, CheckSquare, Sparkles, Trophy, UserPlus, HeartCrack, Swords, Vote, Skull } from "lucide-react";
import { motion } from "framer-motion";
import type { VillaEvent } from "@/lib/api-client-react/src/generated/api.schemas";

const eventIconMap: Record<string, React.ElementType> = {
  contestant_joined: UserPlus,
  split_formed: Heart,
  split_broken: HeartCrack,
  task_created: Swords,
  task_completed: Trophy,
  vote_cast: Vote,
  contestant_dumped: Skull,
};

const eventColorMap: Record<string, string> = {
  contestant_joined: "text-blue-400",
  split_formed: "text-pink-400",
  split_broken: "text-orange-400",
  task_created: "text-yellow-400",
  task_completed: "text-green-400",
  vote_cast: "text-red-400",
  contestant_dumped: "text-gray-400",
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function EventItem({ event, index }: { event: VillaEvent; index: number }) {
  const Icon = eventIconMap[event.type as string] ?? Sparkles;
  const color = eventColorMap[event.type as string] ?? "text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
    >
      <div className={`p-2 rounded-lg bg-white/5 ${color} shrink-0 mt-0.5`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium text-sm">{event.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{formatTimeAgo(event.createdAt)}</span>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: contestants = [] } = useListContestants();
  const { data: splits = [] } = useListSplits();
  const { data: tasks = [] } = useListTasks();
  const { data: events = [] } = useListEvents();

  const activeContestants = contestants.filter(c => c.status === "active").length;
  const activeSplits = splits.filter(s => s.status === "active").length;
  const upcomingTasks = tasks.filter(t => t.status === "upcoming").length;

  const stats = [
    { label: "Active Contestants", value: activeContestants, icon: Users, color: "text-blue-400" },
    { label: "Formed Connections", value: activeSplits, icon: Heart, color: "text-primary" },
    { label: "Upcoming Tasks", value: upcomingTasks, icon: CheckSquare, color: "text-secondary" },
  ];

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl overflow-hidden h-64 md:h-80 w-full glass-panel flex items-end">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/villa-night.png`}
            alt="Splitsvilla at night"
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        <div className="relative z-10 p-8 w-full">
          <h1 className="text-4xl md:text-5xl font-serif text-glow-primary text-white mb-2">Welcome to the Villa</h1>
          <p className="text-lg text-white/80 max-w-2xl">The ultimate test of love, connection, and survival. Who will find their perfect match and secure their place in the villa?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-6 glass-panel flex items-center justify-between hover-elevate">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-4xl font-bold font-serif">{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-8 h-8" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-panel p-6 border-primary/20">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-primary w-5 h-5" />
            <h2 className="text-2xl font-serif">Villa Activity Feed</h2>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {events.length > 0 ? (
              events.map((event, i) => (
                <EventItem key={event.id} event={event} index={i} />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">The villa is quiet... for now.</p>
            )}
          </div>
        </Card>

        <Card className="glass-panel p-6 border-secondary/20">
          <h2 className="text-2xl font-serif mb-6">Villa Rules</h2>
          <ul className="space-y-4 text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-primary font-bold">1.</span>
              <span>Survival in the villa requires a strong connection. Find your split.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-secondary font-bold">2.</span>
              <span>Win tasks to gain power, immunity, and luxury dates.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold">3.</span>
              <span>The Dumping Ground is ruthless. Unsafe contestants face elimination.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">4.</span>
              <span>Consult the Oracle to discover if your bond is scientifically and mystically proven.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
