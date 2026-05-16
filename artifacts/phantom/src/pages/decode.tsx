import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkMessageRead } from "@workspace/api-client-react";
import { Upload, Eye, Clock, CheckCircle2, Lock, Trash2, Ghost, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = `${BASE}/api`;

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type DecodeState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "decoded"; id: string; messageText: string; senderEmail: string | null; createdAt: string }
  | { phase: "locked"; id: string; senderEmail: string | null; createdAt: string }
  | { phase: "already_read"; id: string; createdAt: string }
  | { phase: "error"; message: string };

export default function DecodePage() {
  const { toast } = useToast();
  const [state, setState] = useState<DecodeState>({ phase: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [readDuration, setReadDuration] = useState(0);
  const [isMarkedRead, setIsMarkedRead] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const markReadMutation = useMarkMessageRead({
    mutation: {
      onSuccess: () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsMarkedRead(true);
      },
      onError: () => {
        toast({ title: "Failed to confirm read", variant: "destructive" });
      },
    },
  });

  useEffect(() => {
    if (state.phase === "decoded" && !isMarkedRead) {
      timerRef.current = setInterval(() => setReadDuration((d) => d + 0.1), 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.phase, isMarkedRead]);

  async function processImage(dataUrl: string) {
    setState({ phase: "loading" });
    try {
      const resp = await fetch(`${API_BASE}/messages/decode-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: dataUrl }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setState({ phase: "error", message: data.error ?? "Could not decode image" });
        return;
      }

      if (data.isRead) {
        setState({ phase: "already_read", id: data.id, createdAt: data.createdAt });
        return;
      }
      if (data.isLocked && !data.accessGranted) {
        setState({ phase: "locked", id: data.id, senderEmail: data.senderEmail, createdAt: data.createdAt });
        return;
      }
      if (data.messageText) {
        setReadDuration(0);
        setState({
          phase: "decoded",
          id: data.id,
          messageText: data.messageText,
          senderEmail: data.senderEmail,
          createdAt: data.createdAt,
        });
        return;
      }

      setState({ phase: "error", message: "No message found in this image" });
    } catch {
      setState({ phase: "error", message: "Network error. Please try again." });
    }
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      processImage(result);
    };
    reader.readAsDataURL(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  function reset() {
    setState({ phase: "idle" });
    setReadDuration(0);
    setIsMarkedRead(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={BASE || "/"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Ghost className="w-5 h-5 text-primary" />
            <span className="font-bold tracking-tight font-mono text-lg">PHANTOM</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="font-mono text-xs text-muted-foreground">
                My Transmissions
              </Button>
            </Link>
            <Link href="/compose">
              <Button size="sm" className="font-mono text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                Encode Message
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-mono" data-testid="heading-decode">
            DECODE TRANSMISSION
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Upload the image you received — the hidden message will be extracted
          </p>
        </div>

        {/* Loading */}
        {state.phase === "loading" && (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-mono text-muted-foreground">Scanning image for hidden data...</span>
            </div>
          </div>
        )}

        {/* Idle — upload zone */}
        {state.phase === "idle" && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all
              flex flex-col items-center gap-5
              ${dragOver
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-border hover:border-primary/40 hover:bg-primary/5 bg-card"
              }
            `}
            data-testid="dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              data-testid="input-file"
            />
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
              dragOver ? "bg-primary/20" : "bg-muted/50"
            }`}>
              <Upload className={`w-9 h-9 transition-colors ${dragOver ? "text-primary" : "text-muted-foreground/50"}`} />
            </div>
            <div>
              <p className="text-base font-mono font-semibold text-foreground mb-1">
                Drop image here or click to upload
              </p>
              <p className="text-sm font-mono text-muted-foreground">
                PNG, JPG, WebP — the image you received via WhatsApp, Telegram, etc.
              </p>
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary/70 font-mono text-xs">
              <Ghost className="w-3 h-3 mr-1.5" />
              Platform-only decoding
            </Badge>
          </div>
        )}

        {/* Error */}
        {state.phase === "error" && (
          <div className="space-y-6">
            <div className="border border-destructive/30 rounded-xl bg-destructive/5 p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <ImageIcon className="w-7 h-7 text-destructive/70" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-mono text-destructive mb-2" data-testid="heading-error">
                  DECODE FAILED
                </h2>
                <p className="text-sm font-mono text-muted-foreground">{state.message}</p>
              </div>
            </div>
            <Button onClick={reset} variant="outline" className="w-full font-mono" data-testid="button-try-again">
              Try Another Image
            </Button>
          </div>
        )}

        {/* Already read */}
        {(state.phase === "already_read" || isMarkedRead) && (
          <div className="space-y-6">
            <div className="border border-border rounded-xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-mono mb-2" data-testid="heading-already-read">
                  MESSAGE DESTROYED
                </h2>
                <p className="text-sm font-mono text-muted-foreground">
                  This message has already been read and permanently destroyed. One-time access only.
                </p>
              </div>
            </div>
            <Button onClick={reset} variant="outline" className="w-full font-mono" data-testid="button-decode-another">
              Decode Another Image
            </Button>
          </div>
        )}

        {/* Locked */}
        {state.phase === "locked" && !isMarkedRead && (
          <div className="space-y-6">
            <div className="border border-yellow-500/20 rounded-xl bg-yellow-500/5 p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-mono text-yellow-500 mb-2" data-testid="heading-locked">
                  ACCESS RESTRICTED
                </h2>
                {state.senderEmail && (
                  <p className="text-sm font-mono text-muted-foreground mb-2">
                    From: <span className="text-foreground">{state.senderEmail}</span>
                  </p>
                )}
                <p className="text-xs font-mono text-muted-foreground">
                  Sent {formatTime(state.createdAt)}
                </p>
                <p className="text-sm font-mono text-muted-foreground mt-3">
                  The sender has restricted access. Contact them and ask them to unlock the message from their control center.
                </p>
              </div>
              <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 font-mono text-xs">
                <Lock className="w-3 h-3 mr-1.5" /> Awaiting sender authorization
              </Badge>
            </div>
            <Button onClick={reset} variant="outline" className="w-full font-mono">
              Try Another Image
            </Button>
          </div>
        )}

        {/* Decoded — show message */}
        {state.phase === "decoded" && !isMarkedRead && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">
                <Eye className="w-3 h-3 mr-1.5" /> DECRYPTED
              </Badge>
              {state.senderEmail && (
                <span className="text-xs font-mono text-muted-foreground" data-testid="text-sender">
                  From: <span className="text-foreground">{state.senderEmail}</span>
                </span>
              )}
              <span className="text-xs font-mono text-muted-foreground">
                Sent {formatTime(state.createdAt)}
              </span>
            </div>

            <div
              className="border border-primary/30 rounded-xl bg-primary/5 p-6"
              data-testid="card-message"
            >
              <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-3">
                Hidden Message
              </p>
              <p
                className="text-foreground font-mono text-lg leading-relaxed whitespace-pre-wrap"
                data-testid="text-message"
              >
                {state.messageText}
              </p>
            </div>

            <div className="flex items-center gap-2.5 border border-border rounded-lg p-4 bg-card">
              <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
              <span className="text-sm font-mono text-muted-foreground">Reading time:</span>
              <span className="text-sm font-mono text-yellow-500 font-bold" data-testid="text-timer">
                {formatDuration(readDuration)}
              </span>
            </div>

            <div className="border border-destructive/20 rounded-lg p-3 bg-destructive/5">
              <p className="text-xs font-mono text-destructive/80">
                Once confirmed, this message is permanently destroyed and the sender is notified. You cannot retrieve it again.
              </p>
            </div>

            <Button
              onClick={() =>
                markReadMutation.mutate({
                  id: state.id,
                  data: { readDurationSeconds: readDuration },
                })
              }
              disabled={markReadMutation.isPending}
              className="w-full font-mono bg-primary hover:bg-primary/90 text-primary-foreground h-11"
              data-testid="button-confirm-read"
            >
              {markReadMutation.isPending ? (
                "CONFIRMING..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  I HAVE READ THIS — DESTROY MESSAGE
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
