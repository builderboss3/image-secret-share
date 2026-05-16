import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Upload, LayoutDashboard, Ghost, Lock } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthorized, signOut } = useAuth();
  const [location] = useLocation();

  function navClass(href: string) {
    const active = location === href || location.startsWith(href + "/");
    return `text-xs font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 ${
      active
        ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_8px_hsl(var(--primary)/0.15)]"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }`;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)" }}
      />
      <header className="border-b border-primary/10 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="h-px w-full border-crawl opacity-60" />
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={isAuthorized ? "/dashboard" : "/"} className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
            <Ghost className="w-5 h-5 text-primary group-hover:drop-shadow-[0_0_6px_hsl(var(--primary))] transition-all" />
            <span className="font-bold text-base tracking-widest font-mono text-primary flicker">PHANTOM</span>
          </Link>

          {isAuthorized && (
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/dashboard" className={navClass("/dashboard")}>
                <LayoutDashboard className="w-3.5 h-3.5" /> DASHBOARD
              </Link>
              <Link href="/compose" className={navClass("/compose")}>
                <Lock className="w-3.5 h-3.5" /> ENCODE
              </Link>
              <Link href="/decode" className={navClass("/decode")}>
                <Upload className="w-3.5 h-3.5" /> DECODE
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-3">
            {isAuthorized ? (
              <>
                <div className="status-dot" title="Connected" />
                <Button variant="ghost" size="icon" onClick={signOut}
                  className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-colors" title="Disconnect">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/sign-in">
                <Button size="sm" className="font-mono text-xs cyber-button h-8 px-4">ACCESS TERMINAL</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
