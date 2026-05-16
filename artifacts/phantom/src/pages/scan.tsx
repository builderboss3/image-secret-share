import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetMessageStatus,
  useDecodeMessage,
  useMarkMessageRead,
  getGetMessageStatusQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Unlock, CheckCircle2, Eye, Clock, Trash2, Ghost } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export default function ScanPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [decodeTime, setDecodeTime] = useState<Date | null>(null);
  const [readDuration, setReadDuration] = useState<number>(0);
  const [isMarkedRead, setIsMarkedRead] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    data: status,
    isLoading: statusLoading,
    error: statusError,
  } = useGetMessageStatus(id!, {
    query: {
      enabled: !!id,
      queryKey: getGetMessageStatusQueryKey(id!),
      refetchInterval: decodedMessage ? false : 5000,
    },
  });

  const decodeMutation = useDecodeMessage({
    mutation: {
      onSuccess: (data) => {
        setDecodedMessage(data.messageText);
        setDecodeTime(new Date());
        // Start the reading timer
        timerRef.current = setInterval(() => {
          setReadDuration((d) => d + 0.1);
        }, 100);
      },
      onError: (err: any) => {
        const msg = err?.data?.error || "Could not decode message";
        toast({ title: msg, variant: "destructive" });
      },
    },
  });

  const markReadMutation = useMarkMessageRead({
    mutation: {
      onSuccess: () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsMarkedRead(true);
        queryClient.invalidateQueries({ queryKey: getGetMessageStatusQueryKey(id!) });
      },
      onError: () => {
        toast({ title: "Failed to confirm read", variant: "destructive" });
      },
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ScanHeader />
        <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (statusError || !status) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ScanHeader />
        <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
          <div className="border border-destructive/30 rounded-lg p-8 text-center space-y-4">
            <Trash2 className="w-10 h-10 text-destructive/50 mx-auto" />
            <h2 className="text-lg font-bold font-mono text-destructive" data-testid="heading-not-found">
              TRANSMISSION NOT FOUND
            </h2>
            <p className="text-sm font-mono text-muted-foreground">
              This message does not exist or has been destroyed.
            </p>
            <Link href="/">
              <Button variant="outline" className="font-mono text-xs mt-2">
                Return to base
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Already read
  if (status.isRead || isMarkedRead) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ScanHeader />
        <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
          <div className="border border-border rounded-lg p-8 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-lg font-bold font-mono" data-testid="heading-already-read">
              MESSAGE DESTROYED
            </h2>
            <p className="text-sm font-mono text-muted-foreground">
              This message has already been read and permanently deleted. It cannot be recovered.
            </p>
            <Link href="/">
              <Button variant="outline" className="font-mono text-xs mt-2" data-testid="button-return">
                Return to base
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Message decoded — show it
  if (decodedMessage) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ScanHeader />
        <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl space-y-6">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">
              <Eye className="w-3 h-3 mr-1.5" /> DECRYPTED
            </Badge>
            {decodeTime && (
              <span className="text-xs font-mono text-muted-foreground">
                Decoded at {formatTime(decodeTime.toISOString())}
              </span>
            )}
          </div>

          {/* Message display */}
          <div className="border border-primary/30 rounded-lg bg-primary/5 p-6 space-y-2" data-testid="card-decoded-message">
            <p className="text-xs font-mono text-primary/70 uppercase tracking-wider">Transmission Content</p>
            <p className="text-foreground font-mono text-lg leading-relaxed whitespace-pre-wrap" data-testid="text-decoded-message">
              {decodedMessage}
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 border border-border rounded-lg p-4 bg-card">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-mono text-muted-foreground">Reading time:</span>
            <span className="text-sm font-mono text-yellow-500 font-bold" data-testid="text-timer">
              {formatDuration(readDuration)}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-mono text-muted-foreground/60 text-center">
              Once you confirm, this message will be permanently destroyed and the sender will be notified.
            </p>
            <Button
              onClick={() =>
                markReadMutation.mutate({
                  id: id!,
                  data: { readDurationSeconds: readDuration },
                })
              }
              disabled={markReadMutation.isPending}
              className="w-full font-mono bg-primary hover:bg-primary/90 text-primary-foreground h-11"
              data-testid="button-mark-read"
            >
              {markReadMutation.isPending ? "CONFIRMING..." : "I HAVE READ THIS — DESTROY MESSAGE"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Locked — no access
  if (status.isLocked && !status.accessGranted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ScanHeader />
        <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl space-y-6">
          {/* Sender info */}
          {status.senderEmail && (
            <p className="text-sm font-mono text-muted-foreground" data-testid="text-sender">
              From: <span className="text-foreground">{status.senderEmail}</span>
            </p>
          )}
          <p className="text-xs font-mono text-muted-foreground">
            Sent {formatTime(status.createdAt)}
          </p>

          <div className="border border-yellow-500/20 rounded-lg p-8 text-center space-y-4 bg-yellow-500/5">
            <Lock className="w-10 h-10 text-yellow-500 mx-auto" />
            <h2 className="text-lg font-bold font-mono text-yellow-500" data-testid="heading-locked">
              ACCESS RESTRICTED
            </h2>
            <p className="text-sm font-mono text-muted-foreground">
              This transmission is locked. The sender must grant you access before you can decode it.
              Contact the sender and ask them to unlock it from their control center.
            </p>
            <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 font-mono text-xs">
              <Lock className="w-3 h-3 mr-1.5" /> Awaiting sender authorization
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  // Ready to decode
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScanHeader />
      <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {status.senderEmail && (
          <p className="text-sm font-mono text-muted-foreground" data-testid="text-sender-open">
            From: <span className="text-foreground">{status.senderEmail}</span>
          </p>
        )}
        <p className="text-xs font-mono text-muted-foreground">
          Sent {formatTime(status.createdAt)}
        </p>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary font-mono text-xs">
            <Unlock className="w-3 h-3 mr-1.5" /> READY TO DECODE
          </Badge>
          <Badge variant="outline" className="border-destructive/30 text-destructive font-mono text-xs">
            <Trash2 className="w-3 h-3 mr-1.5" /> ONE-TIME READ
          </Badge>
        </div>

        <p className="text-sm font-mono text-muted-foreground">
          The carrier image below contains a hidden encrypted message. Click decode to reveal it.
          Once read and confirmed, the message will be permanently destroyed.
        </p>

        {/* Warning */}
        <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
          <p className="text-xs font-mono text-destructive/80">
            Warning: Decoding will start a timer. The message is destroyed only after you confirm you have read it.
            Make sure you are ready.
          </p>
        </div>

        <Button
          onClick={() => decodeMutation.mutate({ id: id! })}
          disabled={decodeMutation.isPending}
          className="w-full font-mono bg-primary hover:bg-primary/90 text-primary-foreground h-11"
          data-testid="button-decode"
        >
          {decodeMutation.isPending ? (
            "DECODING..."
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              DECODE MESSAGE
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ScanHeader() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <Link href={basePath || "/"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Ghost className="w-5 h-5 text-primary" />
          <span className="font-bold tracking-tight font-mono">PHANTOM</span>
        </Link>
      </div>
    </header>
  );
}
