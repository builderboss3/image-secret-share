import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Ghost, Upload, Lock, Shield, Eye, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF";

function MatrixRain() {
  const [columns, setColumns] = useState<{ x: number; delay: number; duration: number; chars: string }[]>([]);

  useEffect(() => {
    const count = Math.floor(window.innerWidth / 28);
    setColumns(
      Array.from({ length: count }, (_, i) => ({
        x: i * 28,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
        chars: Array.from({ length: 20 }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]).join(""),
      })),
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.06]">
      {columns.map((col, i) => (
        <div
          key={i}
          className="absolute top-0 font-mono text-xs text-primary leading-7 whitespace-pre"
          style={{
            left: col.x,
            animation: `matrix-fall ${col.duration}s ${col.delay}s linear infinite`,
          }}
        >
          {col.chars.split("").join("\n")}
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const [typedText, setTypedText] = useState("");
  const fullText = "STEGANOGRAPHIC INTELLIGENCE PLATFORM";

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground relative overflow-hidden">
      <MatrixRain />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      {/* Center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/4 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Header */}
      <header className="z-10 border-b border-primary/10 bg-card/30 backdrop-blur-sm">
        <div className="h-px border-crawl opacity-50" />
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ghost className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />
            <span className="font-bold tracking-widest font-mono text-base text-primary glitch-text" data-text="PHANTOM">PHANTOM</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="font-mono text-xs text-muted-foreground hover:text-foreground">
                SIGN IN
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="font-mono text-xs cyber-button h-8 px-4">
                REGISTER
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        {/* Status badge */}
        <div className="fade-in-up-1 inline-flex items-center gap-2 border border-primary/20 bg-primary/5 rounded-full px-4 py-1.5 mb-8">
          <div className="status-dot" />
          <span className="text-xs font-mono text-primary/80 uppercase tracking-widest">
            {typedText}
            <span className="animate-pulse">_</span>
          </span>
        </div>

        <h1 className="fade-in-up-2 text-5xl md:text-8xl font-black tracking-tighter mb-4 text-primary glitch-text" data-text="PHANTOM">
          PHANTOM
        </h1>

        <p className="fade-in-up-3 text-base md:text-lg text-muted-foreground mb-2 max-w-lg font-mono leading-relaxed">
          Hide AES-encrypted messages inside ordinary images.
        </p>
        <p className="fade-in-up-3 text-sm text-muted-foreground/60 mb-10 max-w-md font-mono">
          Share via WhatsApp, Instagram, Telegram — no links, no metadata, no trace.
        </p>

        {/* Panels */}
        <div className="fade-in-up-4 mt-4 grid grid-cols-2 gap-4 max-w-md w-full mb-10">
          <div className="cyber-panel p-5 flex flex-col items-center gap-3 text-center neon-pulse">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-mono text-primary font-bold uppercase tracking-wider">ENCODE</p>
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">Write message → encode into image → download PNG → share anywhere</p>
          </div>
          <div className="cyber-panel p-5 flex flex-col items-center gap-3 text-center border-primary/10">
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center ring-1 ring-border">
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs font-mono text-muted-foreground font-bold uppercase tracking-wider">DECODE</p>
            <p className="text-xs font-mono text-muted-foreground/60 leading-relaxed">Receive image → upload to Phantom → message revealed once → destroyed</p>
          </div>
        </div>

        <div className="fade-in-up-5 flex items-center justify-center gap-4 flex-wrap">
          <Link href="/sign-up">
            <Button size="lg" className="h-12 px-8 text-sm font-mono cyber-button tracking-widest">
              <Lock className="w-4 h-4 mr-2" />
              START ENCODING
            </Button>
          </Link>
          <Link href="/decode">
            <Button size="lg" variant="outline" className="h-12 px-8 text-sm font-mono border-primary/20 hover:bg-primary/5 hover:border-primary/40 tracking-widest">
              <Upload className="w-4 h-4 mr-2" />
              DECODE IMAGE
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature strip */}
      <div className="z-10 border-t border-primary/10 bg-card/20 backdrop-blur-sm py-5">
        <div className="container mx-auto px-4 flex items-center justify-center gap-10 flex-wrap">
          {[
            { icon: Shield, text: "Platform-only decoding" },
            { icon: Eye, text: "One-time read, then destroyed" },
            { icon: Ghost, text: "No links needed" },
            { icon: Zap, text: "Zero metadata" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-muted-foreground">
              <Icon className="w-3.5 h-3.5 text-primary/60" />
              <span className="text-xs font-mono">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
