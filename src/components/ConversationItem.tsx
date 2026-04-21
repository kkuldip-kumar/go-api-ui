import clsx from "clsx";
import { Avatar } from "./Avatar";

type Message = {
  content: string;
  created_at?: string;
};

type Conversation = {
  id: string;
  name?: string;
  participants: string[];
  last_message?: Message;
};

type Props = {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  isOnline: boolean;
  onClick: () => void;
};

function formatTime(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  isOnline,
  onClick,
}: Props) {
  // derive peer label (fallback if name not present)
  const peerId = conversation.participants.find(
    (id) => id !== currentUserId
  );

  const peerLabel = conversation.name || peerId || "Unknown";

  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all",
        isActive
          ? "bg-brand-500/10 border border-brand-500/20"
          : "hover:bg-surface-800/60"
      )}
    >
      {/* Avatar */}
      <Avatar name={peerLabel} size="sm" online={isOnline} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <p
            className={clsx(
              "text-sm font-medium truncate",
              isActive ? "text-white" : "text-surface-100"
            )}
          >
            {peerLabel}
          </p>

          <span className="text-[10px] text-surface-300/40 ml-2">
            {formatTime(conversation.last_message?.created_at)}
          </span>
        </div>

        {/* Last message */}
        <p className="text-xs text-surface-300/50 truncate">
          {conversation.last_message?.content || "No messages yet"}
        </p>
      </div>
    </button>
  );
}