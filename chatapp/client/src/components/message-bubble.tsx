import { CheckCheck, Check } from "lucide-react";
import type { MessageWithSender } from "@shared/schema";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderMessageStatus = () => {
    if (!isOwn) return null;

    if (message.isRead) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else if (message.isDelivered) {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-4 py-1`}>
      <div className="relative max-w-xs lg:max-w-md">
        <div
          className={`rounded-xl px-4 py-2 shadow-md break-words
            ${isOwn ? 'bg-green-700 text-white' : 'bg-gray-800 text-white'}
          `}
        >
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="Shared image"
              className="rounded-lg w-full h-auto mb-2 max-w-sm"
            />
          )}
          <p className="text-base leading-tight">{message.content}</p>
          <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isOwn ? 'text-gray-200' : 'text-gray-400'}`}>
            <span>{formatTime(message.timestamp!)}</span>
            {renderMessageStatus()}
          </div>
        </div>
      </div>
    </div>
  );
}
