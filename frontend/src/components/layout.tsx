import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Users, Heart, Sparkles, CheckSquare, ShieldBan, Trophy, MessageCircle, HeartHandshake, UserCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { title: "Villa Dashboard", href: "/", icon: Sparkles },
  { title: "Cupid", href: "/cupid", icon: HeartHandshake },
  { title: "Contestants", href: "/contestants", icon: Users },
  { title: "Active Splits", href: "/splits", icon: Heart },
  { title: "Oracle & Compatibility", href: "/compatibility", icon: Sparkles },
  { title: "Seek The Oracle", href: "/oracle", icon: MessageCircle },
  { title: "Tasks & Challenges", href: "/tasks", icon: CheckSquare },
  { title: "Dumping Ground", href: "/voting", icon: ShieldBan },
  { title: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { title: "My Account", href: "/account", icon: UserCircle2 },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background selection:bg-primary/30">
        <Sidebar className="border-r border-white/5 bg-background/50 backdrop-blur-xl">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="pt-6 pb-4 px-4 text-xs font-bold uppercase tracking-widest text-primary mb-2">
                <span className="text-glow-primary">Splitsvilla</span>.AI
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
                    return (
                      <SidebarMenuItem key={item.title} className="px-2 py-1">
                        <SidebarMenuButton
                          asChild
                          className={`w-full hover-elevate transition-all duration-300 ${isActive ? 'bg-primary/20 text-primary border-l-2 border-primary rounded-r-md rounded-l-none' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Link href={item.href} className="flex items-center gap-3 w-full py-3 px-3">
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden relative">
          {/* Subtle background glow effect behind main content */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/5 px-4 bg-background/50 backdrop-blur-xl z-10">
            <SidebarTrigger className="hover-elevate text-foreground" />
            <div className="ml-auto flex items-center space-x-4">
              <span className="text-xs uppercase tracking-widest font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Season 1
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 z-10 relative">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-7xl mx-auto h-full"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
