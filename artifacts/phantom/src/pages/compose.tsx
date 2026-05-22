import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useGenerateCarrierImage, useCreateMessage } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { saveMessage } from "@/lib/storage";
import {
  Download, Upload, Lock, Unlock, Sparkles, ChevronRight, ImageIcon, Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ImageType = "solid" | "gradient" | "noise" | "grid" | "dots";
const IMAGE_TYPES: { value: ImageType; label: string }[] = [
  { value: "solid", label: "SOLID" },
  { value: "gradient", label: "GRADIENT" },
  { value: "noise", label: "NOISE" },
  { value: "grid", label: "GRID" },
  { value: "dots", label: "DOTS" },
];

function downloadBase64Image(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

interface CreatedMsg {
  id: string;
  imageData: string;
  isLocked: boolean;
  recipientHint: string | null;
}

export default function ComposePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [messageText, setMessageText] = useState("");
  const [recipientHint, setRecipientHint] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<"generate" | "upload">("generate");
  const [genType, setGenType] = useState<ImageType>("gradient");
  const [color1, setColor1] = useState("#1a1a2e");
  const [color2, setColor2] = useState("#22c55e");
  const [createdMessage, setCreatedMessage] = useState<CreatedMsg | null>(null);

  const generateMutation = useGenerateCarrierImage({
    mutation: {
      onSuccess: (data) => setImageData(data.imageData),
      onError: () => toast({ title: "Failed to generate image", variant: "destructive" }),
    },
  });

  const createMutation = useCreateMessage({
    mutation: {
      onSuccess: (msg) => {
        if (user) {
          saveMessage(user.id, {
            id: msg.id,
            senderId: user.id,
            senderEmail: null,
            recipientHint: msg.recipientHint ?? null,
            imageData: msg.imageData,
            isLocked: msg.isLocked,
            accessGranted: msg.accessGranted,
            isRead: false,
            readAt: null,
            readDurationSeconds: null,
            createdAt: msg.createdAt,
            deletedMessageAt: null,
          });
        }
        setCreatedMessage({
          id: msg.id,
          imageData: msg.imageData,
          isLocked: msg.isLocked,
          recipientHint: msg.recipientHint ?? null,
        });
      },
      onError: () => toast({ title: "Failed to encode message", variant: "destructive" }),
    },
  });

  function handleGenerate() {
    generateMutation.mutate({ data: { type: genType, color1, color2, width: 800, height: 600 } });
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImageData(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!imageData) { toast({ title: "Select or generate an image first", variant: "destructive" }); return; }
    if (!messageText.trim()) { toast({ title: "Write a message to hide", variant: "destructive" }); return; }
    createMutation.mutate({
      data: { messageText: messageText.trim(), imageData, recipientHint: recipientHint.trim() || undefined, isLocked },
    });
  }

  if (createdMessage) {
    const filename = `phantom-${createdMessage.id.slice(0, 8)}.png`;
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-2">
              <ChevronRight className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-mono">TRANSMISSION ENCODED</h1>
            <p className="text-sm text-muted-foreground font-mono">
              Your message is hidden inside this image. Download and send it anywhere.
            </p>
          </div>

          <div className="border border-primary/20 rounded-xl overflow-hidden shadow-lg shadow-primary/5">
            <img src={createdMessage.imageData} alt="Encoded carrier image" className="w-full max-h-72 object-cover" />
          </div>

          <div className="border border-border rounded-xl bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              <p className="text-sm font-mono font-bold">HOW TO SHARE</p>
            </div>
            <ol className="space-y-2.5">
              {[
                "Download the image below",
                "Send it via WhatsApp, Telegram, Instagram DM, or any platform",
                "The receiver opens Phantom → Decode tab → uploads the image",
                "The hidden message is revealed instantly",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm font-mono text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            {createdMessage.isLocked && (
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <Lock className="w-3.5 h-3.5 text-yellow-500" />
                <p className="text-xs font-mono text-yellow-500">
                  Message is locked — grant access from your dashboard before the receiver can decode it.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => downloadBase64Image(createdMessage.imageData, filename)}
              className="w-full font-mono bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
            >
              <Download className="w-5 h-5 mr-2" /> DOWNLOAD IMAGE
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => { setCreatedMessage(null); setMessageText(""); setRecipientHint(""); setImageData(null); setIsLocked(false); }}
                variant="outline" className="font-mono text-sm">
                Encode Another
              </Button>
              <Button onClick={() => setLocation("/dashboard")} variant="outline" className="font-mono text-sm">
                Control Center
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-mono">ENCODE MESSAGE</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Hide your message inside a carrier image — share the image, not a link
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setImageMode("generate")}
                className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${imageMode === "generate" ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                <Sparkles className="w-3 h-3 inline mr-1.5" /> GENERATE
              </button>
              <button onClick={() => setImageMode("upload")}
                className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${imageMode === "upload" ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                <Upload className="w-3 h-3 inline mr-1.5" /> UPLOAD
              </button>
            </div>

            {imageMode === "generate" ? (
              <div className="space-y-4 border border-border rounded-lg p-4 bg-card">
                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground">PATTERN</Label>
                  <div className="flex flex-wrap gap-2">
                    {IMAGE_TYPES.map((t) => (
                      <button key={t.value} onClick={() => setGenType(t.value)}
                        className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${genType === t.value ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[["COLOR 1", color1, setColor1], ["COLOR 2", color2, setColor2]].map(([label, val, set]) => (
                    <div key={String(label)} className="space-y-1.5">
                      <Label className="font-mono text-xs text-muted-foreground">{String(label)}</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={String(val)} onChange={(e) => (set as (v: string) => void)(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" />
                        <Input value={String(val)} onChange={(e) => (set as (v: string) => void)(e.target.value)}
                          className="font-mono text-xs h-8" />
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleGenerate} disabled={generateMutation.isPending} variant="outline"
                  className="w-full font-mono text-xs border-primary/30 text-primary hover:bg-primary/10">
                  {generateMutation.isPending ? "GENERATING..." : "GENERATE IMAGE"}
                </Button>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg p-6 bg-card text-center">
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                  <span className="text-sm font-mono text-muted-foreground">Click to upload carrier image</span>
                  <span className="text-xs font-mono text-muted-foreground/60">PNG, JPG, WebP</span>
                </label>
              </div>
            )}

            <div className="border border-border rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
              {generateMutation.isPending ? (
                <Skeleton className="w-full h-full" />
              ) : imageData ? (
                <img src={imageData} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs font-mono text-muted-foreground/40">Carrier image preview</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="message" className="font-mono text-xs text-muted-foreground">SECRET MESSAGE</Label>
              <Textarea id="message" value={messageText} onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your hidden message here..."
                className="font-mono text-sm min-h-[140px] bg-card border-border resize-none" />
              <p className="text-xs font-mono text-muted-foreground/60">{messageText.length} characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hint" className="font-mono text-xs text-muted-foreground">
                RECIPIENT HINT <span className="text-muted-foreground/40">(OPTIONAL)</span>
              </Label>
              <Input id="hint" value={recipientHint} onChange={(e) => setRecipientHint(e.target.value)}
                placeholder="e.g. For Agent 7..." className="font-mono text-sm bg-card border-border" />
            </div>

            <div className="flex items-center justify-between border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-3">
                {isLocked ? <Lock className="w-4 h-4 text-yellow-500" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-mono text-foreground">ACCESS LOCK</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {isLocked ? "Receiver needs your approval first" : "Anyone with the image can decode"}
                  </p>
                </div>
              </div>
              <Switch checked={isLocked} onCheckedChange={setIsLocked} />
            </div>

            <Button onClick={handleSubmit} disabled={createMutation.isPending || !imageData || !messageText.trim()}
              className="w-full font-mono bg-primary hover:bg-primary/90 text-primary-foreground h-11">
              {createMutation.isPending ? "ENCODING..." : <><Download className="w-4 h-4 mr-2" />ENCODE & PREPARE DOWNLOAD</>}
            </Button>

            <p className="text-xs font-mono text-muted-foreground/60 text-center">
              The encoded image looks identical to the original. Only Phantom can extract the hidden data.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
