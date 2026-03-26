import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo, useAnimation } from "framer-motion";
import { MapPin, Info, X, Heart } from "lucide-react";
import type { CupidProfile } from "@/lib/cupid/api";

interface SwipeCardProps {
  profile: CupidProfile;
  onSwipe: (direction: 'like' | 'pass', profileId: string) => void;
  isTop: boolean;
}

export function SwipeCard({ profile, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [exitX, setExitX] = useState<number>(0);

  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [0, -100], [0, 1]);

  const handleDragEnd = async (e: any, info: PanInfo) => {
    const threshold = 100;
    const velocityThreshold = 500;
    
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      setExitX(300);
      await controls.start({ x: 300, opacity: 0, transition: { duration: 0.3 } });
      onSwipe('like', profile.id);
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      setExitX(-300);
      await controls.start({ x: -300, opacity: 0, transition: { duration: 0.3 } });
      onSwipe('pass', profile.id);
    } else {
      controls.start({ x: 0, transition: { type: "spring", bounce: 0.5, duration: 0.4 } });
    }
  };

  const handleButtonSwipe = async (direction: 'like' | 'pass') => {
    const targetX = direction === 'like' ? 300 : -300;
    setExitX(targetX);
    await controls.start({ x: targetX, opacity: 0, transition: { duration: 0.4 } });
    onSwipe(direction, profile.id);
  };

  return (
    <motion.div
      className="absolute inset-0 w-full h-[70vh] max-h-[700px] rounded-[2rem] shadow-2xl bg-card will-change-transform flex flex-col overflow-hidden border border-white/10"
      style={{ x, rotate, opacity, zIndex: isTop ? 10 : 1 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ scale: 0.95, y: 20 }}
      whileInView={{ scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Image Section */}
      <div className="relative w-full h-[75%] bg-muted">
        {profile.photoUrl ? (
          <img 
            src={profile.photoUrl} 
            alt={profile.name}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-primary/10 text-primary/40">
            <svg className="w-24 h-24 opacity-20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}

        {/* Swipe Indicators */}
        <motion.div 
          className="absolute top-10 right-8 border-4 border-emerald-500 text-emerald-500 rounded-xl px-4 py-1 text-3xl font-black uppercase tracking-wider bg-emerald-500/10 backdrop-blur-sm transform rotate-12"
          style={{ opacity: likeOpacity }}
        >
          LIKE
        </motion.div>
        
        <motion.div 
          className="absolute top-10 left-8 border-4 border-destructive text-destructive rounded-xl px-4 py-1 text-3xl font-black uppercase tracking-wider bg-destructive/10 backdrop-blur-sm transform -rotate-12"
          style={{ opacity: passOpacity }}
        >
          NOPE
        </motion.div>

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        
        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-end gap-3 mb-1">
            <h2 className="text-4xl font-bold leading-none">{profile.name}</h2>
            <span className="text-2xl font-light opacity-90 leading-none pb-0.5">{profile.age}</span>
          </div>
          {profile.location && (
            <div className="flex items-center gap-1.5 opacity-90 mt-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{profile.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="p-6 flex-1 flex flex-col bg-card">
        <div className="flex items-start gap-2 text-muted-foreground mb-4 flex-1">
          <Info className="w-5 h-5 mt-0.5 shrink-0 text-primary/60" />
          <p className="text-sm leading-relaxed line-clamp-3">{profile.bio || "No bio provided."}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-auto">
          <button 
            onClick={(e) => { e.stopPropagation(); handleButtonSwipe('pass'); }}
            className="w-16 h-16 rounded-full bg-card shadow-xl flex items-center justify-center text-destructive border border-white/10 hover:scale-110 hover:bg-destructive/10 transition-transform duration-200 active:scale-95"
          >
            <X className="w-8 h-8" strokeWidth={3} />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); handleButtonSwipe('like'); }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-pink-500 shadow-xl shadow-primary/30 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200 active:scale-95"
          >
            <Heart className="w-10 h-10 fill-current" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
