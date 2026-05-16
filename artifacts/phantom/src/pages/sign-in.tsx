import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { verifyPasscode } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ghost, Eye, EyeOff, Terminal, Lock, Link } from "lucide-react";

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const { authorize } = useAuth();
  const [passcode, setPasscode] = useState("");
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await verifyPasscode(passcode);
      authorize();
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Wrong passcode");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scan-line" />
      </div>

      <div className="z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <Ghost className="w-12 h-12 text-primary drop-shadow-[0_0_12px_hsl(var(--primary))]" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <Ghost className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-widest text-primary glitch-text" data-text="PHANTOM">
            PHANTOM
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1 tracking-widest">SECURE TERMINAL ACCESS</p>
        </div>

        <div className="cyber-panel p-8 space-y-6">
          <div className="border-b border-primary/20 pb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-primary tracking-widest">ENTER ACCESS CODE</span>
          </div>

          {error && (
            <div className="border border-destructive/40 bg-destructive/10 rounded p-3">
              <span className="text-destructive text-xs font-mono">[ERROR] {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <Lock className="w-3 h-3" /> ACCESS CODE
              </Label>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter your secret code"
                  required
                  autoFocus
                  className="font-mono text-sm bg-background/80 border-primary/20 focus:border-primary/60 pr-10"
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs font-mono text-muted-foreground/50 mt-1">
                Code is set via <code className="text-primary/60">DASHBOARD_PASSCODE</code> env var
              </p>
            </div>

            <Button type="submit" disabled={isLoading || !passcode}
              className="w-full font-mono h-11 text-sm tracking-widest cyber-button">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  VERIFYING...
                </span>
              ) : "AUTHENTICATE"}
            </Button>
          </form>

          <div className="border-t border-primary/10 pt-4 text-center">
            <a href="/decode" className="text-xs font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Decode a received image — no code needed →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
