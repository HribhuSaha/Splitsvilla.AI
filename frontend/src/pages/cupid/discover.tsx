import { useState } from "react";
import { useLocation } from "wouter";
import { SwipeCard } from "@/components/cupid/swipe-card";
import { useCupidProfile, useDiscoverProfiles, useCreateSwipe } from "@/lib/cupid/api";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, SearchX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CupidDiscover() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: myProfile, isLoading: isProfileLoading, error: profileError } = useCupidProfile();

  const { data: profiles = [], isLoading: isDiscoverLoading, refetch } = useDiscoverProfiles(!!myProfile);

  const { mutate: swipeMutate } = useCreateSwipe();

  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());

  if (profileError) {
    setLocation("/cupid/profile/setup");
    return null;
  }

  const activeProfiles = profiles.filter(p => !swipedIds.has(p.id));

  const handleSwipe = (direction: 'like' | 'pass', profileId: string) => {
    setSwipedIds(prev => {
      const next = new Set(prev);
      next.add(profileId);
      return next;
    });

    swipeMutate({ targetUserId: profileId, direction }, {
      onSuccess: (res) => {
        if (res.matched) {
          toast({
            title: "It's a Match! 🎉",
            description: "You can now message each other.",
          });
        }
      }
    });
  };

  if (isProfileLoading || isDiscoverLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[70vh]">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
          <Heart className="w-8 h-8 text-primary animate-bounce" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-2 shrink-0">
        <h1 className="text-3xl font-bold text-foreground">💘 Cupid — Discover</h1>
        <div className="w-10 h-10 rounded-full bg-card shadow-sm border border-white/10 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
        </div>
      </div>

      {/* Card Stack Area */}
      <div className="relative flex-1 w-full max-w-md mx-auto h-full flex items-center justify-center">
        <AnimatePresence>
          {activeProfiles.length > 0 ? (
            activeProfiles.map((profile, index) => {
              const isTop = index === activeProfiles.length - 1;
              return (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  isTop={isTop}
                  onSwipe={handleSwipe}
                />
              );
            })
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-3xl shadow-xl w-full h-[60vh] border border-white/10"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <SearchX className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">You've seen everyone!</h3>
              <p className="text-muted-foreground mb-8 max-w-[250px]">
                Check back later for new profiles in your area.
              </p>
              <button 
                onClick={() => { setSwipedIds(new Set()); refetch(); }}
                className="px-8 py-3 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors"
              >
                Refresh Search
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
