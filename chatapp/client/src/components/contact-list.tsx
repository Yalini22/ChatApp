import { CheckCheck, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ContactWithUser } from "@shared/schema";

interface ContactListProps {
  contacts: ContactWithUser[];
  selectedContact: ContactWithUser | null;
  onSelectContact: (contact: ContactWithUser) => void;
}

export function ContactList({
  contacts,
  selectedContact,
  onSelectContact,
}: ContactListProps) {
  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: "long" });
    } else {
      return formatDistanceToNow(messageDate, { addSuffix: true });
    }
  };

  const renderMessageStatus = (message: any, userId: number) => {
    if (message.senderId !== userId) return null;

    if (message.isRead) {
      return <CheckCheck className="w-4 h-4 text-green-500" />;
    } else if (message.isDelivered) {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="overflow-y-auto h-full scrollbar-thin bg-gray-900 text-white">
      {contacts.map((contact) => {
        const lastMessage = contact.lastMessage;
        const timestamp = lastMessage?.timestamp;

        return (
          <div
            key={contact.id}
            className={`p-3 cursor-pointer transition-all border-l-4 ${
              selectedContact?.id === contact.id
                ? "border-green-600 bg-gray-800"
                : "border-transparent hover:bg-gray-800"
            }`}
            onClick={() => onSelectContact(contact)}
          >
            <div className="flex items-center space-x-3">
              <img
                src={contact.user.avatar ?? "/default-avatar.png"}
                alt={contact.user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium truncate text-white">
                    {contact.nickname || contact.user.name}
                  </h4>
                  <span
                    className={`text-xs ${
                      contact.unreadCount > 0 ? "text-green-500" : "text-gray-400"
                    }`}
                  >
                    {timestamp ? formatTime(timestamp) : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center space-x-1 flex-1 min-w-0">
                    {lastMessage && renderMessageStatus(lastMessage, 1)}
                    <p className="text-sm truncate text-gray-400">
                      {lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                  {contact.unreadCount > 0 && (
                    <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5 ml-2 min-w-[20px] text-center">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
