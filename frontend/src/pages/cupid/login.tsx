import { useState } from "react";
import { useCupidAuth } from "@/lib/cupid/api";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "login" | "register";

export default function CupidLogin() {
  const { isAuthenticated, isLoading, login, register } = useCupidAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    let result: { error?: string };

    if (tab === "login") {
      result = await login(username, password);
    } else {
      result = await register({ username, password, firstName: firstName || undefined, lastName: lastName || undefined });
    }

    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
    }
    // If no error, useCupidAuth will set the user and isAuthenticated will trigger redirect
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-background overflow-hidden selection:bg-primary/20">
      
      {/* Decorative Background */}
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[90vw] h-[90vw] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Heart className="w-8 h-8 text-primary fill-primary" />
          <span className="font-bold text-xl tracking-tight text-foreground">Splitsvilla<span className="text-primary">.AI</span></span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col lg:flex-row items-center w-full max-w-7xl mx-auto z-10 px-6 lg:px-12 pt-24 lg:pt-0">
        
        {/* Left Column - Text */}
        <div className="flex-1 flex flex-col justify-center max-w-xl text-center lg:text-left lg:pr-12 mb-12 lg:mb-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 shadow-sm border border-primary/10">
              <Heart className="w-4 h-4 fill-current" />
              <span>Welcome to Splitsvilla.AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-foreground mb-6">
              Your Villa <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">
                Awaits
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-4 font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
              Sign in to access the Villa Dashboard, manage contestants, and find your match on Cupid.
            </p>
          </motion.div>
        </div>

        {/* Right Column - Auth Form */}
        <div className="flex-1 w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-white/10"
          >
            {/* Tab Switcher */}
            <div className="flex rounded-2xl bg-background/50 p-1 mb-8">
              <button
                onClick={() => { setTab("login"); setError(""); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === "login" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab("register"); setError(""); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === "register" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-xl px-4 py-3"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Username</label>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  className="h-12 rounded-xl bg-background border-white/10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  minLength={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  className="h-12 rounded-xl bg-background border-white/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                />
              </div>

              {/* Extra fields for register */}
              <AnimatePresence>
                {tab === "register" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground/80 ml-1">First Name</label>
                        <Input
                          type="text"
                          placeholder="First name"
                          className="h-12 rounded-xl bg-background border-white/10"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground/80 ml-1">Last Name</label>
                        <Input
                          type="text"
                          placeholder="Last name"
                          className="h-12 rounded-xl bg-background border-white/10"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-14 text-lg rounded-full mt-6 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-white shadow-xl shadow-primary/20 font-bold"
              >
                {isSubmitting ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {tab === "login" ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => { setTab(tab === "login" ? "register" : "login"); setError(""); }}
                className="text-primary font-semibold hover:underline"
              >
                {tab === "login" ? "Create one" : "Sign in"}
              </button>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
