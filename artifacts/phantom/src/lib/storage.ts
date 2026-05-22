export interface StoredMessage {
  id: string;
  senderId: string;
  senderEmail: string | null;
  recipientHint: string | null;
  imageData: string;
  isLocked: boolean;
  accessGranted: boolean;
  isRead: boolean;
  readAt: string | null;
  readDurationSeconds: number | null;
  createdAt: string;
  deletedMessageAt: string | null;
}

function key(userId: string) {
  return `phantom_msgs_${userId}`;
}

export function getMessages(userId: string): StoredMessage[] {
  try {
    return JSON.parse(localStorage.getItem(key(userId)) ?? "[]");
  } catch {
    return [];
  }
}

export function saveMessage(userId: string, msg: StoredMessage) {
  const msgs = getMessages(userId);
  localStorage.setItem(key(userId), JSON.stringify([msg, ...msgs]));
}

export function deleteMessage(userId: string, msgId: string) {
  const msgs = getMessages(userId).filter((m) => m.id !== msgId);
  localStorage.setItem(key(userId), JSON.stringify(msgs));
}

export function updateMessage(userId: string, msgId: string, patch: Partial<StoredMessage>) {
  const msgs = getMessages(userId).map((m) => (m.id === msgId ? { ...m, ...patch } : m));
  localStorage.setItem(key(userId), JSON.stringify(msgs));
}

export function getStats(userId: string) {
  const msgs = getMessages(userId);
  return {
    totalSent: msgs.length,
    totalRead: msgs.filter((m) => m.isRead).length,
    totalPending: msgs.filter((m) => !m.isRead).length,
    totalLocked: msgs.filter((m) => m.isLocked && !m.accessGranted).length,
    recentMessages: msgs.slice(0, 5),
  };
}
