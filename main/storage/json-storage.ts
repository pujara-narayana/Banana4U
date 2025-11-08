import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import * as crypto from 'crypto';
import { UserProfile, ConversationHistory, Message, Achievement } from '../../shared/types';

// Storage directory
const getStorageDir = (): string => {
  const userDataPath = app.getPath('userData');
  const storageDir = path.join(userDataPath, 'banana4u-data');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  return storageDir;
};

// File paths
const getUsersFile = (): string => path.join(getStorageDir(), 'users.json');
const getProfilesFile = (): string => path.join(getStorageDir(), 'profiles.json');
const getConversationsFile = (): string => path.join(getStorageDir(), 'conversations.json');

// Helper functions
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

// User interface
export interface User {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  created_at: number;
  last_login_at?: number;
}

export interface UserData {
  users: User[];
  currentUserId?: string;
}

export interface ProfileData {
  [userId: string]: UserProfile;
}

export interface ConversationData {
  [conversationId: string]: ConversationHistory;
}

// Password hashing
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, originalHash] = hash.split(':');
  const newHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return originalHash === newHash;
}

// User operations
export function createUser(username: string, email: string | undefined, password: string): User {
  const usersData = readJsonFile<UserData>(getUsersFile(), { users: [] });

  // Check if username exists
  if (usersData.users.some(u => u.username === username)) {
    throw new Error('Username already taken');
  }

  // Check if email exists
  if (email && usersData.users.some(u => u.email === email)) {
    throw new Error('Email already registered');
  }

  const user: User = {
    id: crypto.randomUUID(),
    username,
    email,
    passwordHash: hashPassword(password),
    created_at: Date.now(),
  };

  usersData.users.push(user);
  writeJsonFile(getUsersFile(), usersData);

  // Create default profile
  const profilesData = readJsonFile<ProfileData>(getProfilesFile(), {});
  profilesData[user.id] = {
    name: username,
    totalPoints: 0,
    currentLevel: 'green',
    dailyStreak: 0,
    lastActiveDate: new Date(),
    achievements: [],
    preferences: {},
    learningGoals: [],
  };
  writeJsonFile(getProfilesFile(), profilesData);

  return user;
}

export function authenticateUser(username: string, password: string): User | null {
  const usersData = readJsonFile<UserData>(getUsersFile(), { users: [] });

  const user = usersData.users.find(
    u => u.username === username || u.email === username
  );

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  // Update last login
  user.last_login_at = Date.now();
  writeJsonFile(getUsersFile(), usersData);

  return user;
}

export function getUserById(userId: string): User | null {
  const usersData = readJsonFile<UserData>(getUsersFile(), { users: [] });
  return usersData.users.find(u => u.id === userId) || null;
}

export function setCurrentUser(userId: string | null): void {
  const usersData = readJsonFile<UserData>(getUsersFile(), { users: [] });
  usersData.currentUserId = userId || undefined;
  writeJsonFile(getUsersFile(), usersData);
}

export function getCurrentUser(): User | null {
  const usersData = readJsonFile<UserData>(getUsersFile(), { users: [] });
  if (!usersData.currentUserId) return null;
  return getUserById(usersData.currentUserId);
}

export function isUsernameAvailable(username: string): boolean {
  const usersData = readJsonFile<UserData>(getUsersFile(), { users: [] });
  return !usersData.users.some(u => u.username === username);
}

export function isEmailAvailable(email: string): boolean {
  const usersData = readJsonFile<UserData>(getUsersFile(), { users: [] });
  return !usersData.users.some(u => u.email === email);
}

// Profile operations
export function getProfile(userId: string): UserProfile | null {
  const profilesData = readJsonFile<ProfileData>(getProfilesFile(), {});
  return profilesData[userId] || null;
}

export function updateProfile(userId: string, updates: Partial<UserProfile>): void {
  const profilesData = readJsonFile<ProfileData>(getProfilesFile(), {});
  const current = profilesData[userId] || {
    totalPoints: 0,
    currentLevel: 'green',
    dailyStreak: 0,
    lastActiveDate: new Date(),
    achievements: [],
    preferences: {},
    learningGoals: [],
  };

  profilesData[userId] = {
    ...current,
    ...updates,
    lastActiveDate: updates.lastActiveDate || current.lastActiveDate,
  };

  writeJsonFile(getProfilesFile(), profilesData);
}

// Conversation operations
export function createConversation(userId: string, personality: string = 'default'): string {
  const conversationsData = readJsonFile<ConversationData>(getConversationsFile(), {});
  const conversationId = crypto.randomUUID();

  conversationsData[conversationId] = {
    id: conversationId,
    timestamp: new Date(),
    messages: [],
    topics: [],
    context: '',
    personality: personality as any,
  };

  writeJsonFile(getConversationsFile(), conversationsData);
  return conversationId;
}

export function getConversation(conversationId: string): ConversationHistory | null {
  const conversationsData = readJsonFile<ConversationData>(getConversationsFile(), {});
  const conv = conversationsData[conversationId];
  if (!conv) return null;

  // Convert timestamp string to Date if needed
  if (typeof conv.timestamp === 'string') {
    conv.timestamp = new Date(conv.timestamp);
  }

  // Convert message timestamps
  conv.messages = conv.messages.map(msg => ({
    ...msg,
    timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
  }));

  return conv;
}

export function listConversations(userId: string, limit: number = 50): ConversationHistory[] {
  // For simplicity, return all conversations. In a real app, you'd filter by userId
  const conversationsData = readJsonFile<ConversationData>(getConversationsFile(), {});
  return Object.values(conversationsData)
    .map(conv => {
      // Convert timestamp string to Date if needed
      if (typeof conv.timestamp === 'string') {
        conv.timestamp = new Date(conv.timestamp);
      }
      // Convert message timestamps
      conv.messages = conv.messages.map(msg => ({
        ...msg,
        timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
      }));
      return conv;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export function updateConversation(conversationId: string, updates: { title?: string }): void {
  const conversationsData = readJsonFile<ConversationData>(getConversationsFile(), {});
  if (conversationsData[conversationId]) {
    // Note: ConversationHistory doesn't have title, but we can add it if needed
    writeJsonFile(getConversationsFile(), conversationsData);
  }
}

export function deleteConversation(conversationId: string): void {
  const conversationsData = readJsonFile<ConversationData>(getConversationsFile(), {});
  delete conversationsData[conversationId];
  writeJsonFile(getConversationsFile(), conversationsData);
}

export function addMessage(conversationId: string, message: Message): void {
  const conversationsData = readJsonFile<ConversationData>(getConversationsFile(), {});
  if (!conversationsData[conversationId]) {
    throw new Error('Conversation not found');
  }

  conversationsData[conversationId].messages.push(message);
  conversationsData[conversationId].timestamp = new Date(); // Update timestamp
  writeJsonFile(getConversationsFile(), conversationsData);
}

export function getMessages(conversationId: string): Message[] {
  const conversationsData = readJsonFile<ConversationData>(getConversationsFile(), {});
  const conversation = conversationsData[conversationId];
  if (!conversation) return [];

  // Convert message timestamps from string to Date if needed
  return conversation.messages.map(msg => ({
    ...msg,
    timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
  }));
}

