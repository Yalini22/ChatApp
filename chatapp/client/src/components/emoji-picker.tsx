import { useEffect, useRef } from "react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const commonEmojis = [
  "😀", "😊", "😂", "🥰", "😍", "🤗", "🤔", "😐",
  "😑", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯",
  "😪", "😋", "😘", "😗", "😙", "😚", "🤪", "😜",
  "🤑", "🤗", "🤭", "🤫", "🤥", "😶", "😌", "😔",
  "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶",
  "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐",
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙",
  "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
  "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
  "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️",
  "🔥", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️",
  "🎉", "🎊", "🎈", "🎁", "🎀", "🎗️", "🎟️", "🎫"
];

export function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 bg-white border border-light rounded-lg shadow-lg p-4 z-10 w-80 max-h-64 overflow-y-auto scrollbar-thin"
    >
      <div className="grid grid-cols-8 gap-2">
        {commonEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiSelect(emoji)}
            className="text-xl hover:bg-gray-100 p-2 rounded transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
