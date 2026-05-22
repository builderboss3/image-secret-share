import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { register, login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ghost, Eye, EyeOff, Terminal, User, Lock } from "lucide-react";

type Tab = "login" | "register";

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const { authorize } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (tab === "register" && password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setIsLoading(true);
    try {
      const user = tab === "register"
        ? await register(username, password)
        : await login(username, password);
      authorize(user);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
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
          <p className="text-xs font-mono text-muted-foreground mt-1 tracking-widest">STEGANOGRAPHIC INTELLIGENCE PLATFORM</p>
        </div>

        <div className="cyber-panel p-8 space-y-6">
          <div className="flex border border-primary/20 rounded overflow-hidden">
            <button
              type="button"
              onClick={() => { setTab("login"); setError(null); }}
              className={`flex-1 py-2 text-xs font-mono tracking-widest transition-colors ${
                tab === "login"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => { setTab("register"); setError(null); }}
              className={`flex-1 py-2 text-xs font-mono tracking-widest transition-colors ${
                tab === "register"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              REGISTER
            </button>
          </div>

          <div className="border-b border-primary/20 pb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-primary tracking-widest">
              {tab === "login" ? "ACCESS TERMINAL" : "CREATE IDENTITY"}
            </span>
          </div>

          {error && (
            <div className="border border-destructive/40 bg-destructive/10 rounded p-3">
              <span className="text-destructive text-xs font-mono">[ERROR] {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <User className="w-3 h-3" /> USERNAME
              </Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_codename"
                required
                autoFocus
                autoComplete="username"
                className="font-mono text-sm bg-background/80 border-primary/20 focus:border-primary/60"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <Lock className="w-3 h-3" /> PASSWORD
              </Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === "register" ? "Min. 6 characters" : "••••••••"}
                  required
                  autoComplete={tab === "register" ? "new-password" : "current-password"}
                  className="font-mono text-sm bg-background/80 border-primary/20 focus:border-primary/60 pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === "register" && (
              <div className="space-y-2">
                <Label className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                  <Lock className="w-3 h-3" /> CONFIRM PASSWORD
                </Label>
                <Input
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                  className="font-mono text-sm bg-background/80 border-primary/20 focus:border-primary/60"
                />
              </div>
            )}

            <Button type="submit" disabled={isLoading || !username || !password}
              className="w-full font-mono h-11 text-sm tracking-widest cyber-button">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  {tab === "register" ? "CREATING..." : "VERIFYING..."}
                </span>
              ) : tab === "register" ? "CREATE ACCOUNT" : "AUTHENTICATE"}
            </Button>
          </form>

          <div className="border-t border-primary/10 pt-4 text-center">
            <p className="text-xs font-mono text-muted-foreground/50">
              {tab === "login" ? (
                <>No account?{" "}
                  <button onClick={() => setTab("register")} className="text-primary/60 hover:text-primary underline">
                    Register here
                  </button>
                </>
              ) : (
                <>Already registered?{" "}
                  <button onClick={() => setTab("login")} className="text-primary/60 hover:text-primary underline">
                    Login here
                  </button>
                </>
              )}
            </p>
            <a href="/decode" className="block mt-2 text-xs font-mono text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              Decode a received image — no account needed →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
