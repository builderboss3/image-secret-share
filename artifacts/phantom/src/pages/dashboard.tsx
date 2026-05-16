import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListMessages,
  useGetMessageStats,
  useDeleteMessage,
  useGrantMessageAccess,
  useRevokeMessageAccess,
  getListMessagesQueryKey,
  getGetMessageStatsQueryKey,
} from "@workspace/api-client-react";
import type { Message } from "@workspace/api-client-react";
import {
  Clock,
  CheckCircle2,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Plus,
  Shield,
  Eye,
  EyeOff,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessageCard({ message }: { message: Message }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useDeleteMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMessageStatsQueryKey() });
        toast({ title: "Transmission destroyed" });
      },
    },
  });

  const grantMutation = useGrantMessageAccess({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMessageStatsQueryKey() });
        toast({ title: "Access granted" });
      },
    },
  });

  const revokeMutation = useRevokeMessageAccess({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMessageStatsQueryKey() });
        toast({ title: "Access revoked" });
      },
    },
  });

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const shareLink = `${window.location.origin}${basePath}/scan/${message.id}`;

  function copyLink() {
    navigator.clipboard.writeText(shareLink);
    toast({ title: "Link copied to clipboard" });
  }

  return (
    <div
      data-testid={`card-message-${message.id}`}
      className="border border-border rounded-lg bg-card overflow-hidden flex flex-col md:flex-row gap-0"
    >
      {/* Image thumbnail */}
      <div className="w-full md:w-32 h-32 flex-shrink-0 overflow-hidden bg-muted">
        <img
          src={message.imageData}
          alt="Carrier image"
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {message.isRead ? (
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs" data-testid={`badge-read-${message.id}`}>
                <CheckCircle2 className="w-3 h-3 mr-1" /> DELIVERED
              </Badge>
            ) : (
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground font-mono text-xs" data-testid={`badge-pending-${message.id}`}>
                <Clock className="w-3 h-3 mr-1" /> PENDING
              </Badge>
            )}
            {message.isLocked && (
              <Badge variant="outline" className="border-yellow-500/40 text-yellow-500 font-mono text-xs" data-testid={`badge-locked-${message.id}`}>
                {message.accessGranted ? (
                  <><Unlock className="w-3 h-3 mr-1" /> UNLOCKED</>
                ) : (
                  <><Lock className="w-3 h-3 mr-1" /> LOCKED</>
                )}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-mono" data-testid={`text-created-${message.id}`}>
            {formatTime(message.createdAt)}
          </span>
        </div>

        {message.recipientHint && (
          <p className="text-sm text-muted-foreground truncate font-mono" data-testid={`text-hint-${message.id}`}>
            To: {message.recipientHint}
          </p>
        )}

        {message.isRead && message.readAt && (
          <div className="text-xs font-mono space-y-0.5" data-testid={`text-receipt-${message.id}`}>
            <p className="text-primary/80">
              Read at {formatTime(message.readAt)}
            </p>
            {message.readDurationSeconds != null && (
              <p className="text-muted-foreground">
                Reading time: {formatDuration(message.readDurationSeconds)}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyLink}
            className="h-7 text-xs font-mono text-muted-foreground hover:text-foreground"
            data-testid={`button-copy-${message.id}`}
          >
            <Copy className="w-3 h-3 mr-1.5" /> COPY LINK
          </Button>

          {message.isLocked && !message.isRead && (
            message.accessGranted ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revokeMutation.mutate({ id: message.id })}
                disabled={revokeMutation.isPending}
                className="h-7 text-xs font-mono text-yellow-500 hover:text-yellow-400"
                data-testid={`button-revoke-${message.id}`}
              >
                <EyeOff className="w-3 h-3 mr-1.5" /> REVOKE
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => grantMutation.mutate({ id: message.id })}
                disabled={grantMutation.isPending}
                className="h-7 text-xs font-mono text-primary hover:text-primary/80"
                data-testid={`button-grant-${message.id}`}
              >
                <Eye className="w-3 h-3 mr-1.5" /> GRANT ACCESS
              </Button>
            )
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMutation.mutate({ id: message.id })}
            disabled={deleteMutation.isPending}
            className="h-7 text-xs font-mono text-destructive hover:text-destructive/80 ml-auto"
            data-testid={`button-delete-${message.id}`}
          >
            <Trash2 className="w-3 h-3 mr-1.5" /> DESTROY
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetMessageStats();
  const { data: messages, isLoading: messagesLoading } = useListMessages();

  const statCards = [
    { label: "TRANSMISSIONS", value: stats?.totalSent ?? 0, icon: Send, color: "text-foreground" },
    { label: "DELIVERED", value: stats?.totalRead ?? 0, icon: CheckCircle2, color: "text-primary" },
    { label: "PENDING", value: stats?.totalPending ?? 0, icon: Clock, color: "text-yellow-500" },
    { label: "LOCKED", value: stats?.totalLocked ?? 0, icon: Shield, color: "text-red-400" },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono" data-testid="heading-dashboard">
              CONTROL CENTER
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              Active transmissions and delivery status
            </p>
          </div>
          <Link href="/compose">
            <Button className="font-mono text-sm bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-new-transmission">
              <Plus className="w-4 h-4 mr-2" />
              NEW TRANSMISSION
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="border border-border rounded-lg bg-card p-4 flex flex-col gap-2"
              data-testid={`card-stat-${stat.label.toLowerCase()}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <span className={`text-3xl font-bold font-mono ${stat.color}`} data-testid={`text-stat-value-${stat.label.toLowerCase()}`}>
                  {stat.value}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Messages */}
        <div className="space-y-3">
          <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider" data-testid="heading-transmissions">
            Transmissions
          </h2>

          {messagesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
            </div>
          ) : (
            <div
              className="border border-dashed border-border rounded-lg p-12 text-center"
              data-testid="empty-transmissions"
            >
              <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-mono text-sm">No transmissions yet</p>
              <p className="text-muted-foreground/60 font-mono text-xs mt-1">Create your first secret message</p>
              <Link href="/compose">
                <Button variant="outline" size="sm" className="mt-4 font-mono text-xs" data-testid="button-create-first">
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
