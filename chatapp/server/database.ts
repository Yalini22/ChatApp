import { MongoClient, Db, Collection } from 'mongodb';
import type { User, Contact, Message } from '@shared/schema';

class DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    const uri = process.env.MONGODB_URI || 'mongodb+srv:/your mongodb url/';

    try {
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        tls: true,
      });
      await this.client.connect();
      await this.client.db('admin').command({ ping: 1 });
      this.db = this.client.db('whatsapp');
      this.isConnected = true;
      console.log('Successfully connected to MongoDB');

      await this.initializeDefaultData();
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
      this.db = null;
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  getUsersCollection(): Collection<User> {
    return this.getDb().collection<User>('users');
  }

  getContactsCollection(): Collection<Contact> {
    return this.getDb().collection<Contact>('contacts');
  }

  getMessagesCollection(): Collection<Message> {
    return this.getDb().collection<Message>('messages');
  }

  private async initializeDefaultData(): Promise<void> {
    const usersCount = await this.getUsersCollection().countDocuments();

    if (usersCount === 0) {
      const defaultUsers: User[] = [
        {
          id: 1,
          username: 'sarah',
          name: 'Sarah Johnson',
          avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
          status: 'online',
          lastSeen: new Date(),
        },
        {
          id: 2,
          username: 'mike',
          name: 'Mike Thompson',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          status: 'online',
          lastSeen: new Date(),
        },
        {
          id: 3,
          username: 'emily',
          name: 'Emily Davis',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          status: 'offline',
          lastSeen: new Date(Date.now() - 86400000),
        },
        {
          id: 4,
          username: 'alex',
          name: 'Alex Rodriguez',
          avatar: 'https://randomuser.me/api/portraits/men/68.jpg',
          status: 'offline',
          lastSeen: new Date(Date.now() - 259200000),
        },
        {
          id: 5,
          username: 'lisa',
          name: 'Lisa Chen',
          avatar: 'https://randomuser.me/api/portraits/women/18.jpg',
          status: 'offline',
          lastSeen: new Date(Date.now() - 604800000),
        },
        
      ];

      await this.getUsersCollection().insertMany(defaultUsers);

      const defaultContacts: Contact[] = [
        { id: 1, userId: 1, contactId: 2, nickname: null },
        { id: 2, userId: 1, contactId: 3, nickname: null },
        { id: 3, userId: 1, contactId: 4, nickname: null },
        { id: 4, userId: 1, contactId: 5, nickname: null },
      ];

      await this.getContactsCollection().insertMany(defaultContacts);

      const defaultMessages: Message[] = [
        {
          id: 1,
          senderId: 2,
          receiverId: 1,
          content: "Hey Sarah! How's the new project coming along?",
          messageType: 'text',
          imageUrl: null,
          timestamp: new Date(Date.now() - 120000),
          isRead: true,
          isDelivered: true,
        },
        {
          id: 2,
          senderId: 1,
          receiverId: 2,
          content: 'Going great! Just finished the wireframes. Want to take a look?',
          messageType: 'text',
          imageUrl: null,
          timestamp: new Date(Date.now() - 60000),
          isRead: true,
          isDelivered: true,
        },
        {
          id: 3,
          senderId: 2,
          receiverId: 1,
          content: 'Absolutely! Can you share them in our team channel?',
          messageType: 'text',
          imageUrl: null,
          timestamp: new Date(),
          isRead: false,
          isDelivered: true,
        },
      ];

      await this.getMessagesCollection().insertMany(defaultMessages);
      console.log('Default data initialized in MongoDB');
    }
  }
}

export const dbConnection = new DatabaseConnection();
