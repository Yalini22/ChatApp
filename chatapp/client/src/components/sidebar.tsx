import { useState } from "react";
import { Search, MessageSquarePlus, MoreVertical } from "lucide-react";
import { ContactList } from "./contact-list";
import type { User, ContactWithUser } from "@shared/schema";

interface SidebarProps {
  currentUser: User;
  contacts: ContactWithUser[];
  selectedContact: ContactWithUser | null;
  onSelectContact: (contact: ContactWithUser) => void;
}

export function Sidebar({
  currentUser,
  contacts,
  selectedContact,
  onSelectContact,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img
              src={
                currentUser.avatar ||
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
              }
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium">{currentUser.name}</h3>
              <p className="text-xs text-gray-400 capitalize">{currentUser.status}</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button className="p-2 text-gray-300 hover:bg-gray-700 rounded-full">
              <MessageSquarePlus className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-300 hover:bg-gray-700 rounded-full">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 text-sm text-white rounded-lg focus:outline-none focus:border-green-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ContactList
          contacts={filteredContacts}
          selectedContact={selectedContact}
          onSelectContact={onSelectContact}
        />
      </div>
    </div>
  );
}
