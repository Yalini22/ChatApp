
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Video, Phone, MoreVertical } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, ContactWithUser, MessageWithSender } from "@shared/schema";

interface ChatAreaProps {
  contact: ContactWithUser;
  currentUser: User;
  onBackToContacts: () => void;
  isMobile: boolean;
}

export function ChatArea({ contact, currentUser, onBackToContacts, isMobile }: ChatAreaProps) {
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], error, isLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/messages", contact.user.id, currentUser.id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/messages/${contact.user.id}?currentUserId=${currentUser.id}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status} — ${errorText}`);
      }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const errorText = await res.text();
        throw new Error(`Expected JSON but got: ${errorText.slice(0, 100)}`);
      }
      return res.json();
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      receiverId: number;
      content: string;
      messageType?: string;
      imageUrl?: string;
    }) => {
      const response = await apiRequest("POST", "/api/messages", messageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", contact.user.id, currentUser.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    await sendMessageMutation.mutateAsync({
      receiverId: contact.user.id,
      content,
      messageType: imageUrl ? "image" : "text",
      imageUrl,
    });
  };

  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Chat Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <button
              onClick={onBackToContacts}
              className="p-2 text-gray-400 hover:bg-gray-700 rounded-full mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <img
            src={
              contact.user.avatar ||
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
            }
            alt={contact.user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-white">{contact.user.name}</h3>
            <p className="text-xs text-gray-400 capitalize">{contact.user.status}</p>
          </div>
        </div>

        {/* Chat Actions */}
        <div className="flex space-x-2">
          <button className="p-2 text-gray-400 hover:bg-gray-700 rounded-full transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:bg-gray-700 rounded-full transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:bg-gray-700 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4 bg-gray-900">
        {isLoading && <p className="text-center text-sm text-gray-400">Loading messages...</p>}
        {error && (
          <div className="text-red-500 text-sm text-center">
            Failed to load messages. Check server logs.
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === currentUser.id}
          />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="relative max-w-xs lg:max-w-md">
              <div className="bg-gray-700 p-3 rounded-lg shadow-sm chat-bubble-tail chat-bubble-received">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} onTyping={simulateTyping} />
    </div>
  );
}

