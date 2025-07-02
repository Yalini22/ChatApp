import {
  users,
  contacts,
  messages,
  type User,
  type InsertUser,
  type Contact,
  type InsertContact,
  type Message,
  type InsertMessage,
  type ContactWithUser,
  type MessageWithSender,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;

  getContacts(userId: number): Promise<ContactWithUser[]>;
  addContact(contact: InsertContact): Promise<Contact>;

  getMessages(userId: number, contactId: number): Promise<MessageWithSender[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: number): Promise<void>;
  markMessageAsDelivered(messageId: number): Promise<void>;
}


export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<number, Contact>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentContactId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentContactId = 1;
    this.currentMessageId = 1;

    // Initialize with some default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default users
    const defaultUsers = [
      {
        id: 1,
        username: "sarah",
        name: "Sarah Johnson",
        avatar:
          "https://randomuser.me/api/portraits/women/65.jpg",
        status: "online",
        lastSeen: new Date(),
      },
      {
        id: 2,
        username: "mike",
        name: "Mike Thompson",
        avatar:
          "https://randomuser.me/api/portraits/men/32.jpg",
        status: "online",
        lastSeen: new Date(),
      },
      {
        id: 3,
        username: "emily",
        name: "Emily Davis",
        avatar:
        "https://randomuser.me/api/portraits/women/44.jpg",
        status: "offline",
        lastSeen: new Date(Date.now() - 86400000), // Yesterday
      },
      {
        id: 4,
        username: "alex",
        name: "Alex Rodriguez",
        avatar:
          "https://randomuser.me/api/portraits/men/68.jpg",
        status: "offline",
        lastSeen: new Date(Date.now() - 259200000), // 3 days ago
      },
      {
        id: 5,
        username: "lisa",
        name: "Lisa Chen",
        avatar:
          "https://randomuser.me/api/portraits/women/18.jpg",
        status: "offline",
        lastSeen: new Date(Date.now() - 604800000), // Week ago
      },
    ];

    defaultUsers.forEach((user) => {
      this.users.set(user.id, user as User);
    });

    // Create contacts for user 1 (Sarah)
    const defaultContacts = [
      { id: 1, userId: 1, contactId: 2, nickname: null },
      { id: 2, userId: 1, contactId: 3, nickname: null },
      { id: 3, userId: 1, contactId: 4, nickname: null },
      { id: 4, userId: 1, contactId: 5, nickname: null },
    ];

    defaultContacts.forEach((contact) => {
      this.contacts.set(contact.id, contact as Contact);
    });

    // Create some initial messages
    const defaultMessages = [
      {
        id: 1,
        senderId: 2,
        receiverId: 1,
        content: "Hey Sarah! How's the new project coming along?",
        messageType: "text",
        imageUrl: null,
        timestamp: new Date(Date.now() - 120000), // 2 minutes ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: 2,
        senderId: 1,
        receiverId: 2,
        content:
          "Going great! Just finished the wireframes. Want to take a look?",
        messageType: "text",
        imageUrl: null,
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: 3,
        senderId: 2,
        receiverId: 1,
        content: "Absolutely! Can you share them in our team channel?",
        messageType: "text",
        imageUrl: null,
        timestamp: new Date(),
        isRead: false,
        isDelivered: true,
      },
    ];

    defaultMessages.forEach((message) => {
      this.messages.set(message.id, message as Message);
    });

    this.currentUserId = 6;
    this.currentContactId = 5;
    this.currentMessageId = 4;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      avatar: insertUser.avatar || null,
      status: insertUser.status || "offline",
      lastSeen: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStatus(id: number, status: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.status = status;
      user.lastSeen = new Date();
    }
  }

  async getContacts(userId: number): Promise<ContactWithUser[]> {
    const userContacts = Array.from(this.contacts.values()).filter(
      (contact) => contact.userId === userId,
    );

    const contactsWithUsers: ContactWithUser[] = [];

    for (const contact of userContacts) {
      const user = this.users.get(contact.contactId);
      if (user) {
        // Get last message between users
        const lastMessage = Array.from(this.messages.values())
          .filter(
            (msg) =>
              (msg.senderId === userId &&
                msg.receiverId === contact.contactId) ||
              (msg.senderId === contact.contactId && msg.receiverId === userId),
          )
          .sort(
            (a, b) =>
              new Date(b.timestamp!).getTime() -
              new Date(a.timestamp!).getTime(),
          )[0];

        // Count unread messages
        const unreadCount = Array.from(this.messages.values()).filter(
          (msg) =>
            msg.senderId === contact.contactId &&
            msg.receiverId === userId &&
            !msg.isRead,
        ).length;

        contactsWithUsers.push({
          ...contact,
          user,
          lastMessage,
          unreadCount,
        });
      }
    }

    // Sort by last message timestamp
    return contactsWithUsers.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp
        ? new Date(a.lastMessage.timestamp).getTime()
        : 0;
      const bTime = b.lastMessage?.timestamp
        ? new Date(b.lastMessage.timestamp).getTime()
        : 0;
      return bTime - aTime;
    });
  }

  async addContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const contact: Contact = {
      ...insertContact,
      id,
      nickname: insertContact.nickname || null,
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async getMessages(
    userId: number,
    contactId: number,
  ): Promise<MessageWithSender[]> {
    const conversationMessages = Array.from(this.messages.values())
      .filter(
        (msg) =>
          (msg.senderId === userId && msg.receiverId === contactId) ||
          (msg.senderId === contactId && msg.receiverId === userId),
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime(),
      );

    const messagesWithSenders: MessageWithSender[] = [];

    for (const message of conversationMessages) {
      const sender = this.users.get(message.senderId);
      if (sender) {
        messagesWithSenders.push({
          ...message,
          sender,
        });
      }
    }

    return messagesWithSenders;
  }

  async sendMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      messageType: insertMessage.messageType || "text",
      imageUrl: insertMessage.imageUrl || null,
      timestamp: new Date(),
      isRead: false,
      isDelivered: true,
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.isRead = true;
    }
  }

  async markMessageAsDelivered(messageId: number): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.isDelivered = true;
    }
  }
}

// MongoDB integration available in mongodb-storage.ts
// Currently using in-memory storage for reliability
export const storage = new MemStorage();  
