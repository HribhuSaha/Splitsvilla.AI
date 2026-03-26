import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import { useCupidAuth } from "@/lib/cupid/api";

// Pages
import Dashboard from "@/pages/dashboard";
import Contestants from "@/pages/contestants";
import Splits from "@/pages/splits";
import Compatibility from "@/pages/compatibility";
import Tasks from "@/pages/tasks";
import Voting from "@/pages/voting";
import Leaderboard from "@/pages/leaderboard";
import OracleChat from "@/pages/oracle";
import MyAccount from "@/pages/my-account";

// Cupid Pages
import CupidLogin from "@/pages/cupid/login";
import CupidDiscover from "@/pages/cupid/discover";
import CupidMatches from "@/pages/cupid/matches";
import CupidChat from "@/pages/cupid/chat";
import CupidProfile from "@/pages/cupid/profile";
import CupidSetupProfile from "@/pages/cupid/setup-profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useCupidAuth();
  
  if (isLoading) return <div className="min-h-screen bg-background" />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Login - shown outside layout */}
      <Route path="/login" component={CupidLogin} />
      
      {/* All other routes wrapped in layout + auth */}
      <Route>
        <AuthenticatedApp />
      </Route>
    </Switch>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useCupidAuth();

  if (isLoading) return <div className="min-h-screen bg-background" />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  return (
    <AppLayout>
      <Switch>
        {/* Splitsvilla Routes */}
        <Route path="/" component={Dashboard} />
        <Route path="/contestants" component={Contestants} />
        <Route path="/splits" component={Splits} />
        <Route path="/compatibility" component={Compatibility} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/voting" component={Voting} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/oracle" component={OracleChat} />
        <Route path="/account" component={MyAccount} />

        {/* Cupid Routes */}
        <Route path="/cupid" component={CupidDiscover} />
        <Route path="/cupid/matches" component={CupidMatches} />
        <Route path="/cupid/matches/:id" component={CupidChat} />
        <Route path="/cupid/profile" component={CupidProfile} />
        <Route path="/cupid/profile/setup" component={CupidSetupProfile} />
        
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
