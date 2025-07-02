import { useState, useRef } from "react";
import { Smile, Paperclip, Send, Mic } from "lucide-react";
import { EmojiPicker } from "./emoji-picker";

interface MessageInputProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  onTyping: () => void;
}

export function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
      textareaRef.current && (textareaRef.current.style.height = "auto");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 80) + "px";
    }
    if (value.length > 0) onTyping();
  };

  const handleEmojiSelect = (emoji: string) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBefore = message.substring(0, cursorPos);
    const textAfter = message.substring(cursorPos);
    setMessage(textBefore + emoji + textAfter);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    }, 0);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setTimeout(() => {
        const mockImageUrl = "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e";
        onSendMessage("Shared an image", mockImageUrl);
        setIsUploading(false);
      }, 1000);
    }
  };

  return (
    <div className="p-4 bg-gray-900 border-t border-gray-700">
      <div className="flex items-end space-x-2">
        <div className="flex space-x-1">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-300 hover:bg-gray-700 rounded-full"
            >
              <Smile className="w-5 h-5" />
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-300 hover:bg-gray-700 rounded-full disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            placeholder="Type a message"
            className="w-full p-3 pr-12 bg-gray-800 text-white border border-gray-600 rounded-lg resize-none focus:outline-none focus:border-green-600 text-sm max-h-20 min-h-[44px]"
            rows={1}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isUploading}
          className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {message.trim() ? <Send className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
