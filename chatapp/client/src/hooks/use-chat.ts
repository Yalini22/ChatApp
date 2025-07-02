import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, ContactWithUser, MessageWithSender } from "@shared/schema";

export function useChat() {
  const [selectedContact, setSelectedContact] = useState<ContactWithUser | null>(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  const { data: contacts = [] } = useQuery<ContactWithUser[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: messages = [] } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/messages", selectedContact?.user.id],
    enabled: !!selectedContact,
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
      if (selectedContact) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedContact.user.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("PATCH", `/api/messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      if (selectedContact) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedContact.user.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", "/api/user/status", { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/current"] });
    },
  });

  const sendMessage = useCallback(async (
    content: string, 
    imageUrl?: string
  ) => {
    if (!selectedContact) return;

    await sendMessageMutation.mutateAsync({
      receiverId: selectedContact.user.id,
      content,
      messageType: imageUrl ? "image" : "text",
      imageUrl,
    });
  }, [selectedContact, sendMessageMutation]);

  const selectContact = useCallback((contact: ContactWithUser) => {
    setSelectedContact(contact);
    
    // Mark unread messages as read
    if (contact.unreadCount > 0) {
      // This would typically mark all unread messages as read
      // For now, we'll just invalidate queries to refresh the state
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    }
  }, [queryClient]);

  return {
    currentUser,
    contacts,
    messages,
    selectedContact,
    selectContact,
    sendMessage,
    markAsRead: markAsReadMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isLoading: !currentUser,
    isSending: sendMessageMutation.isPending,
  };
}


