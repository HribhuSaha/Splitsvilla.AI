import { useState } from "react";
import { useCupidAuth, useCupidProfile, useCupidMatches } from "@/lib/cupid/api";
import { useListSplits } from "@/lib/api-client-react/src/index";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, Grid3X3, Heart, HeartHandshake, Image, Camera, MapPin, Edit3, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

type Tab = "pictures" | "splits" | "matches";

export default function MyAccount() {
  const { user, logout } = useCupidAuth();
  const [, setLocation] = useLocation();
  const { data: cupidProfile } = useCupidProfile();
  const { data: matches = [] } = useCupidMatches(!!cupidProfile);
  const { data: splits = [] } = useListSplits();
  const [activeTab, setActiveTab] = useState<Tab>("pictures");

  // Stats
  const matchCount = matches.length;
  const splitCount = splits.length;
  const activeSplits = splits.filter((s: any) => s.status === "active").length;

  // Mock pictures (user's profile photos + placeholder gallery)
  const pictures = cupidProfile?.photoUrl
    ? [cupidProfile.photoUrl]
    : [];

  const tabs: { id: Tab; label: string; icon: typeof Grid3X3 }[] = [
    { id: "pictures", label: "Pictures", icon: Image },
    { id: "splits", label: "Splits", icon: Heart },
    { id: "matches", label: "Matches", icon: HeartHandshake },
  ];

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">

      {/* ── Header Row ── */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">@{user?.username ?? "user"}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setLocation("/cupid/profile/setup")}
          >
            <Edit3 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* ── Profile Info ── */}
      <div className="flex items-start gap-6 md:gap-10 py-6">

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-[3px] ring-primary/40 ring-offset-4 ring-offset-background bg-muted">
            {cupidProfile?.photoUrl ? (
              <img src={cupidProfile.photoUrl} alt={cupidProfile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                {user?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <button
            onClick={() => setLocation("/cupid/profile/setup")}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-background hover:scale-110 transition-transform"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Row (Instagram-style) */}
        <div className="flex-1">
          <div className="flex items-center gap-8 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{pictures.length}</div>
              <div className="text-xs text-muted-foreground font-medium">pictures</div>
            </div>
            <div className="text-center cursor-pointer" onClick={() => setActiveTab("splits")}>
              <div className="text-xl font-bold text-foreground">{splitCount}</div>
              <div className="text-xs text-muted-foreground font-medium">splits</div>
            </div>
            <div className="text-center cursor-pointer" onClick={() => setActiveTab("matches")}>
              <div className="text-xl font-bold text-foreground">{matchCount}</div>
              <div className="text-xs text-muted-foreground font-medium">matches</div>
            </div>
          </div>

          {/* Name & Bio */}
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">
              {cupidProfile?.name ?? user?.firstName ?? user?.username ?? "User"}
              {cupidProfile?.age ? `, ${cupidProfile.age}` : ""}
            </h2>
            {cupidProfile?.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {cupidProfile.location}
              </p>
            )}
            {cupidProfile?.bio && (
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed whitespace-pre-wrap line-clamp-3">
                {cupidProfile.bio}
              </p>
            )}
            {cupidProfile?.gender && (
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold uppercase">
                  {cupidProfile.gender}
                </span>
                {cupidProfile.interestedIn?.map((g) => (
                  <span key={g} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-bold uppercase">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex gap-2 mb-6">
        <Button
          variant="outline"
          className="flex-1 rounded-xl h-10 font-semibold border-white/10 hover:bg-muted"
          onClick={() => setLocation("/cupid/profile/setup")}
        >
          Edit Profile
        </Button>
        <Button
          variant="outline"
          className="flex-1 rounded-xl h-10 font-semibold border-white/10 hover:bg-muted"
          onClick={() => setLocation("/cupid")}
        >
          Find Matches
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl h-10 w-10 border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* ── Story Highlights (optional quick links) ── */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {[
          { label: "Cupid", emoji: "💘", href: "/cupid" },
          { label: "Dashboard", emoji: "✨", href: "/" },
          { label: "Oracle", emoji: "🔮", href: "/oracle" },
          { label: "Challenge", emoji: "⚡", href: "/tasks" },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-16 h-16 rounded-full bg-card border-2 border-white/10 flex items-center justify-center text-2xl hover:border-primary/40 transition-colors">
              {item.emoji}
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex border-t border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-all border-t-2 -mt-[2px]",
              activeTab === tab.id
                ? "border-t-primary text-foreground"
                : "border-t-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 py-4">
        <AnimatePresence mode="wait">
          {/* Pictures Tab */}
          {activeTab === "pictures" && (
            <motion.div
              key="pictures"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {pictures.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {pictures.map((url, i) => (
                    <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted">
                      <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">No Pictures Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Set up your Cupid profile to add photos</p>
                  <Button variant="outline" className="rounded-xl border-white/10" onClick={() => setLocation("/cupid/profile/setup")}>
                    Add Photos
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Splits Tab */}
          {activeTab === "splits" && (
            <motion.div
              key="splits"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {splits.length > 0 ? (
                splits.map((split: any, i: number) => (
                  <motion.div
                    key={split.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-white/5 hover:shadow-md transition-all"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                      split.status === "active" ? "bg-primary/10" :
                      split.status === "winner" ? "bg-emerald-500/10" :
                      "bg-destructive/10"
                    )}>
                      <Heart className={cn(
                        "w-6 h-6",
                        split.status === "active" ? "text-primary fill-primary/30" :
                        split.status === "winner" ? "text-emerald-500 fill-emerald-500/30" :
                        "text-destructive"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-sm truncate">{split.contestant1Name}</h3>
                        <span className="text-muted-foreground text-xs">×</span>
                        <h3 className="font-bold text-foreground text-sm truncate">{split.contestant2Name}</h3>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          split.status === "active" ? "bg-primary/10 text-primary" :
                          split.status === "winner" ? "bg-emerald-500/10 text-emerald-500" :
                          "bg-destructive/10 text-destructive"
                        )}>
                          {split.status}
                        </span>
                        {split.compatibilityScore && (
                          <span className="text-[10px] text-muted-foreground font-medium">{split.compatibilityScore}% compatible</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">No Splits</h3>
                  <p className="text-sm text-muted-foreground">Villa connections will appear here</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Matches Tab */}
          {activeTab === "matches" && (
            <motion.div
              key="matches"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {matches.length > 0 ? (
                matches.map((match, i) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/cupid/matches/${match.id}`} className="block">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-white/5 hover:shadow-md transition-all active:scale-[0.98]">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-muted shrink-0">
                          {match.otherProfile?.photoUrl ? (
                            <img src={match.otherProfile.photoUrl} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                              {match.otherProfile?.name[0] ?? "?"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-sm">{match.otherProfile?.name ?? "Unknown"}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {match.lastMessage?.content || "No messages yet — say hello!"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(match.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                          {match.canMessage && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-4">
                    <HeartHandshake className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">No Matches Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Start swiping on Cupid to find matches</p>
                  <Button variant="outline" className="rounded-xl border-white/10" onClick={() => setLocation("/cupid")}>
                    Go to Cupid
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
