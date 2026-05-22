import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getMessages, deleteMessage, updateMessage, getStats, type StoredMessage } from "@/lib/storage";
import {
  Clock, CheckCircle2, Lock, Unlock, Trash2, Copy, Plus, Shield, Eye, EyeOff, Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function MessageCard({ message, userId, onUpdate }: { message: StoredMessage; userId: string; onUpdate: () => void }) {
  const { toast } = useToast();

  function handleDelete() {
    deleteMessage(userId, message.id);
    toast({ title: "Transmission destroyed" });
    onUpdate();
  }

  function handleGrant() {
    updateMessage(userId, message.id, { accessGranted: true });
    toast({ title: "Access granted" });
    onUpdate();
  }

  function handleRevoke() {
    updateMessage(userId, message.id, { accessGranted: false });
    toast({ title: "Access revoked" });
    onUpdate();
  }

  function copyImage() {
    const a = document.createElement("a");
    a.href = message.imageData;
    a.download = `phantom-${message.id.slice(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Image downloaded" });
  }

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden flex flex-col md:flex-row gap-0">
      <div className="w-full md:w-32 h-32 flex-shrink-0 overflow-hidden bg-muted">
        <img src={message.imageData} alt="Carrier image" className="w-full h-full object-cover opacity-80" />
      </div>
      <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {message.isRead ? (
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" /> DELIVERED
              </Badge>
            ) : (
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground font-mono text-xs">
                <Clock className="w-3 h-3 mr-1" /> PENDING
              </Badge>
            )}
            {message.isLocked && (
              <Badge variant="outline" className="border-yellow-500/40 text-yellow-500 font-mono text-xs">
                {message.accessGranted
                  ? <><Unlock className="w-3 h-3 mr-1" /> UNLOCKED</>
                  : <><Lock className="w-3 h-3 mr-1" /> LOCKED</>}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-mono">{formatTime(message.createdAt)}</span>
        </div>

        {message.recipientHint && (
          <p className="text-sm text-muted-foreground truncate font-mono">To: {message.recipientHint}</p>
        )}

        {message.isRead && message.readAt && (
          <div className="text-xs font-mono space-y-0.5">
            <p className="text-primary/80">Read at {formatTime(message.readAt)}</p>
            {message.readDurationSeconds != null && (
              <p className="text-muted-foreground">Reading time: {formatDuration(message.readDurationSeconds)}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
          <Button variant="ghost" size="sm" onClick={copyImage}
            className="h-7 text-xs font-mono text-muted-foreground hover:text-foreground">
            <Copy className="w-3 h-3 mr-1.5" /> DOWNLOAD
          </Button>

          {message.isLocked && !message.isRead && (
            message.accessGranted ? (
              <Button variant="ghost" size="sm" onClick={handleRevoke}
                className="h-7 text-xs font-mono text-yellow-500 hover:text-yellow-400">
                <EyeOff className="w-3 h-3 mr-1.5" /> REVOKE
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleGrant}
                className="h-7 text-xs font-mono text-primary hover:text-primary/80">
                <Eye className="w-3 h-3 mr-1.5" /> GRANT ACCESS
              </Button>
            )
          )}

          <Button variant="ghost" size="sm" onClick={handleDelete}
            className="h-7 text-xs font-mono text-destructive hover:text-destructive/80 ml-auto">
            <Trash2 className="w-3 h-3 mr-1.5" /> DESTROY
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const userId = user?.id ?? "";
  const messages = getMessages(userId);
  const stats = getStats(userId);

  const statCards = [
    { label: "TRANSMISSIONS", value: stats.totalSent, icon: Send, color: "text-foreground" },
    { label: "DELIVERED", value: stats.totalRead, icon: CheckCircle2, color: "text-primary" },
    { label: "PENDING", value: stats.totalPending, icon: Clock, color: "text-yellow-500" },
    { label: "LOCKED", value: stats.totalLocked, icon: Shield, color: "text-red-400" },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">CONTROL CENTER</h1>
            {user && (
              <p className="text-sm text-muted-foreground font-mono mt-1">
                Agent: <span className="text-primary">{user.username}</span>
              </p>
            )}
          </div>
          <Link href="/compose">
            <Button className="font-mono text-sm bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> NEW TRANSMISSION
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="border border-border rounded-lg bg-card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Transmissions</h2>
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg) => (
                <MessageCard key={msg.id} message={msg} userId={userId} onUpdate={refresh} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg p-12 text-center">
              <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-mono text-sm">No transmissions yet</p>
              <p className="text-muted-foreground/60 font-mono text-xs mt-1">Create your first secret message</p>
              <Link href="/compose">
                <Button variant="outline" size="sm" className="mt-4 font-mono text-xs">
                  <Plus className="w-3 h-3 mr-1.5" /> Begin Transmission
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
