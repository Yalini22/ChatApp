import { dbConnection } from './database';
import type { 
  User, 
  InsertUser, 
  Contact, 
  InsertContact, 
  Message, 
  InsertMessage, 
  ContactWithUser, 
  MessageWithSender 
} from '@shared/schema';
import { IStorage } from './storage';

export class MongoStorage implements IStorage {
  private nextUserId = 6;
  private nextContactId = 5;
  private nextMessageId = 4;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      await dbConnection.connect();
      await this.updateCounters();
    } catch (error) {
      console.error('Failed to initialize MongoDB connection:', error);
    }
  }

  private async updateCounters() {
    try {
      const users = dbConnection.getUsersCollection();
      const contacts = dbConnection.getContactsCollection();
      const messages = dbConnection.getMessagesCollection();

      const maxUser = await users.findOne({}, { sort: { id: -1 } });
      const maxContact = await contacts.findOne({}, { sort: { id: -1 } });
      const maxMessage = await messages.findOne({}, { sort: { id: -1 } });

      if (maxUser) this.nextUserId = maxUser.id + 1;
      if (maxContact) this.nextContactId = maxContact.id + 1;
      if (maxMessage) this.nextMessageId = maxMessage.id + 1;
    } catch (error) {
      console.error('Failed to update counters:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await dbConnection.getUsersCollection().findOne({ id });
      return user || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await dbConnection.getUsersCollection().findOne({ username });
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await dbConnection.getUsersCollection().findOne({ email });
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      const user = await dbConnection.getUsersCollection().findOne({ email });
      return !!user && user.password === password;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  async createUser(insertUser: InsertUser & { password: string }): Promise<User> {
  try {
    const id = this.nextUserId++;
    const userWithPassword: User & { password: string } = {
      ...insertUser,
      id,
      avatar: insertUser.avatar ?? null,
      status: insertUser.status ?? "offline",
      lastSeen: new Date(),
    };

    await dbConnection.getUsersCollection().insertOne(userWithPassword);

    // Remove password before returning
    const { password, ...rest } = userWithPassword;
    return rest as User;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
}



  async updateUserStatus(id: number, status: string): Promise<void> {
    try {
      await dbConnection.getUsersCollection().updateOne(
        { id },
        { $set: { status, lastSeen: new Date() } }
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  }

  async getContacts(userId: number): Promise<ContactWithUser[]> {
    try {
      const contacts = await dbConnection.getContactsCollection()
        .find({ userId })
        .toArray();

      const contactIds = contacts.map(contact => contact.contactId);

      const users = await dbConnection.getUsersCollection()
        .find({ id: { $in: contactIds } })
        .toArray();

      const userMap = new Map(users.map(user => [user.id, user]));

      const unreadCounts = await dbConnection.getMessagesCollection().aggregate([
        {
          $match: {
            receiverId: userId,
            isRead: false,
            senderId: { $in: contactIds }
          }
        },
        {
          $group: {
            _id: "$senderId",
            count: { $sum: 1 }
          }
        }
      ]).toArray();
      const unreadMap = new Map(unreadCounts.map(u => [u._id, u.count]));

      const lastMessagePromises = contactIds.map(contactId =>
        dbConnection.getMessagesCollection().findOne(
          {
            $or: [
              { senderId: userId, receiverId: contactId },
              { senderId: contactId, receiverId: userId }
            ]
          },
          { sort: { timestamp: -1 } }
        )
      );
      const lastMessages = await Promise.all(lastMessagePromises);
      const lastMessageMap = new Map(contactIds.map((id, i) => [id, lastMessages[i]]));

      const contactsWithUsers: ContactWithUser[] = (await Promise.all(
        contacts.map(async (contact) => {
          const user = userMap.get(contact.contactId);
          if (!user) return null;

          return {
            ...contact,
            user,
            lastMessage: lastMessageMap.get(contact.contactId) || undefined,
            unreadCount: unreadMap.get(contact.contactId) || 0
          };
        })
      )).filter(Boolean) as ContactWithUser[];

      return contactsWithUsers.sort((a, b) => {
        const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  }

  async addContact(insertContact: InsertContact): Promise<Contact> {
    try {
      const id = this.nextContactId++;
      const contact: Contact = {
        ...insertContact,
        id,
        nickname: insertContact.nickname || null
      };

      await dbConnection.getContactsCollection().insertOne(contact);
      return contact;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw new Error('Failed to add contact');
    }
  }

  async getMessages(userId: number, contactId: number): Promise<MessageWithSender[]> {
    try {
      const messages = await dbConnection.getMessagesCollection()
        .find({
          $or: [
            { senderId: userId, receiverId: contactId },
            { senderId: contactId, receiverId: userId }
          ]
        })
        .sort({ timestamp: 1 })
        .toArray();

      const messagesWithSenders: MessageWithSender[] = [];

      for (const message of messages) {
        const sender = await this.getUser(message.senderId);
        if (sender) {
          messagesWithSenders.push({ ...message, sender });
        }
      }

      return messagesWithSenders;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async sendMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      const id = this.nextMessageId++;
      const message: Message = {
        ...insertMessage,
        id,
        messageType: insertMessage.messageType || "text",
        imageUrl: insertMessage.imageUrl || null,
        timestamp: new Date(),
        isRead: false,
        isDelivered: true
      };

      await dbConnection.getMessagesCollection().insertOne(message);
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    try {
      await dbConnection.getMessagesCollection().updateOne(
        { id: messageId },
        { $set: { isRead: true } }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new Error('Failed to mark message as read');
    }
  }

  async markMessageAsDelivered(messageId: number): Promise<void> {
    try {
      await dbConnection.getMessagesCollection().updateOne(
        { id: messageId },
        { $set: { isDelivered: true } }
      );
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      throw new Error('Failed to mark message as delivered');
    }
  }
}


