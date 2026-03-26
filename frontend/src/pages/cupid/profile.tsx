import { useCupidAuth, useCupidProfile } from "@/lib/cupid/api";
import { Button } from "@/components/ui/button";
import { MapPin, Settings, LogOut, Edit3 } from "lucide-react";
import { useLocation } from "wouter";

export default function CupidProfile() {
  const { logout } = useCupidAuth();
  const [, setLocation] = useLocation();
  const { data: profile, isLoading } = useCupidProfile();

  if (isLoading) {
    return <div className="flex-1 bg-background" />;
  }

  if (!profile) {
    setLocation("/cupid/profile/setup");
    return null;
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">💘 Cupid — Profile</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="w-6 h-6 text-foreground" />
        </Button>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40 rounded-full overflow-hidden bg-muted shadow-xl border-4 border-card mb-6">
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-4xl text-primary font-bold">
              {profile.name[0]}
            </div>
          )}
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">{profile.name}, {profile.age}</h2>
          {profile.location && (
            <p className="flex items-center justify-center gap-1 text-muted-foreground mt-1 font-medium">
              <MapPin className="w-4 h-4" />
              {profile.location}
            </p>
          )}
        </div>

        <div className="w-full bg-card rounded-3xl p-6 shadow-sm border border-white/5 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-foreground text-lg">About Me</h3>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => setLocation("/cupid/profile/setup")}>
              <Edit3 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {profile.bio || "No bio added yet."}
          </p>
          
          <div className="mt-6 flex flex-wrap gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              {profile.gender}
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">
              Looking for: {profile.interestedIn.join(', ')}
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full rounded-2xl h-14 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/40 transition-all font-bold text-base"
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
