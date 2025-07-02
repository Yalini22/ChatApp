import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { ChatArea } from "@/components/chat-area";
import { useQuery } from "@tanstack/react-query";
import type { User, ContactWithUser } from "@shared/schema";

export default function Chat() {
  const [selectedContact, setSelectedContact] = useState<ContactWithUser | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const {
    data: currentUser,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError
  } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  const { data: contacts = [] } = useQuery<ContactWithUser[]>({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/contacts", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => console.log("Direct fetch test:", data))
      .catch(err => console.error("Error:", err));
  }, []);

  useEffect(() => {
    console.log("Fetched contacts:", contacts);
  }, [contacts]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowSidebar(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSelectContact = (contact: ContactWithUser) => {
    setSelectedContact(contact);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleBackToContacts = () => {
    if (isMobile) {
      setShowSidebar(true);
      setSelectedContact(null);
    }
  };

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-chat-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chatapp mx-auto mb-4"></div>
          <p className="text-secondary">Loading ChatApp...</p>
        </div>
      </div>
    );
  }

  if (isUserError || !currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-chat-bg">
        <div className="text-center">
          <p className="text-red-500">Error loading user: {userError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-chat-bg">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'w-full' : 'w-80'} 
          ${isMobile && !showSidebar ? 'hidden' : 'flex'} 
          flex-col bg-sidebar-bg border-r border-light transition-all duration-300
        `}>
          <Sidebar
            currentUser={currentUser as User}
            contacts={contacts}
            selectedContact={selectedContact}
            onSelectContact={handleSelectContact}
          />
        </div>

        {/* Chat Area */}
        <div className={`
          flex-1 
          ${isMobile && showSidebar ? 'hidden' : 'flex'} 
          flex-col
        `}>
          {selectedContact ? (
            <ChatArea
              contact={selectedContact}
              currentUser={currentUser as User}
              onBackToContacts={handleBackToContacts}
              isMobile={isMobile}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-chat-bg">
              <div className="text-center max-w-md p-8">
                <div className="w-64 h-48 mx-auto mb-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center opacity-20">
                  <svg className="w-16 h-16 text-[#777]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-light text-primary mb-4">ChatApp</h2>
                <p className="text-secondary text-sm leading-relaxed">
                  Real-time messaging with modern interface design.<br />
                  Connect with friends and colleagues instantly.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


