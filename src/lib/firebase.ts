import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { ChatSession, WorkspaceSettings, CanvasDocument } from '../types';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = firebaseConfigData;

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with specified database ID
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Test connection on boot constraint from Firebase Integration Skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline or unreachable. Local cache active.');
      return false;
    }
    // Permission denied on test/connection is expected if rules deny default collection read
    return true;
  }
}

// Run test connection
testConnection().catch((err) => console.debug('Firebase boot test connection result:', err));

// Auth Helpers
export async function initAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const userCred = await signInAnonymously(auth);
          resolve(userCred.user);
        } catch (err) {
          console.warn('Anonymous sign-in not enabled or encountered error:', err);
          resolve(null);
        }
      }
    });
  });
}

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function updateUserProfile(displayName: string, photoURL?: string): Promise<User | null> {
  if (!auth.currentUser) return null;
  await updateProfile(auth.currentUser, {
    displayName: displayName.trim(),
    photoURL: photoURL || auth.currentUser.photoURL || undefined,
  });

  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(
      userRef,
      {
        uid: auth.currentUser.uid,
        displayName: displayName.trim(),
        email: auth.currentUser.email || null,
        photoURL: photoURL || auth.currentUser.photoURL || null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to sync updated profile to Firestore:', err);
  }

  return auth.currentUser;
}

export async function fetchUserProfile(userId: string): Promise<{ displayName?: string; email?: string; photoURL?: string } | null> {
  if (!userId) return null;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        displayName: data.displayName,
        email: data.email,
        photoURL: data.photoURL,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch user profile from Firestore:', err);
  }
  return null;
}

// Firestore Persistence API for Dey AI Workspace

// 1. User Profile & Settings
export async function syncUserSettingsToCloud(userId: string, settings: WorkspaceSettings): Promise<void> {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        uid: userId,
        theme: settings.theme,
        defaultModel: settings.defaultModel,
        systemInstruction: settings.systemInstruction,
        enableWebSearch: settings.enableWebSearch,
        thinkingLevel: settings.thinkingLevel,
        messageBoxWidth: settings.messageBoxWidth || 'wide',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to sync settings to Firestore:', err);
  }
}

export async function fetchUserSettingsFromCloud(userId: string): Promise<Partial<WorkspaceSettings> | null> {
  if (!userId) return null;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        theme: data.theme,
        defaultModel: data.defaultModel,
        systemInstruction: data.systemInstruction,
        enableWebSearch: data.enableWebSearch,
        thinkingLevel: data.thinkingLevel,
        messageBoxWidth: data.messageBoxWidth,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch settings from Firestore:', err);
  }
  return null;
}

// 2. Chat Sessions & Messages
export async function syncChatToCloud(userId: string, chat: ChatSession): Promise<void> {
  if (!userId || !chat.id) return;
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chat.id);
    await setDoc(
      chatRef,
      {
        id: chat.id,
        userId,
        title: chat.title || 'Untitled Conversation',
        createdAt: chat.createdAt || Date.now(),
        updatedAt: chat.updatedAt || Date.now(),
        isPinned: Boolean(chat.isPinned),
        model: chat.model || 'gemini-3.8-flash',
      },
      { merge: true }
    );

    // Sync messages in subcollection
    if (Array.isArray(chat.messages)) {
      for (const msg of chat.messages) {
        if (!msg.id) continue;
        const msgRef = doc(db, 'users', userId, 'chats', chat.id, 'messages', msg.id);
        await setDoc(
          msgRef,
          {
            id: msg.id,
            chatId: chat.id,
            userId,
            role: msg.role || 'user',
            content: msg.content || '',
            timestamp: msg.timestamp || Date.now(),
            model: msg.modelUsed || chat.model || 'gemini-3.8-flash',
          },
          { merge: true }
        );
      }
    }
  } catch (err) {
    console.warn('Failed to sync chat to Firestore:', err);
  }
}

export async function fetchChatsFromCloud(userId: string): Promise<ChatSession[]> {
  if (!userId) return [];
  try {
    const chatsCol = collection(db, 'users', userId, 'chats');
    const q = query(chatsCol, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    const chats: ChatSession[] = [];
    for (const chatDoc of snapshot.docs) {
      const chatData = chatDoc.data();
      // Load messages
      const msgsCol = collection(db, 'users', userId, 'chats', chatDoc.id, 'messages');
      const msgsQ = query(msgsCol, orderBy('timestamp', 'asc'));
      const msgsSnapshot = await getDocs(msgsQ);
      const messages = msgsSnapshot.docs.map((docSnap) => {
        const m = docSnap.data();
        return {
          id: m.id,
          role: m.role as any,
          content: m.content,
          timestamp: m.timestamp,
          modelUsed: m.model,
        };
      });

      chats.push({
        id: chatData.id || chatDoc.id,
        title: chatData.title,
        createdAt: chatData.createdAt,
        updatedAt: chatData.updatedAt,
        isPinned: chatData.isPinned,
        model: chatData.model,
        messages,
      });
    }

    return chats;
  } catch (err) {
    console.warn('Failed to fetch chats from Firestore:', err);
    return [];
  }
}

export async function deleteChatFromCloud(userId: string, chatId: string): Promise<void> {
  if (!userId || !chatId) return;
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await deleteDoc(chatRef);
  } catch (err) {
    console.warn('Failed to delete chat from Firestore:', err);
  }
}

// 3. Canvas Scratchpad Documents
export async function syncCanvasDocToCloud(userId: string, docItem: CanvasDocument): Promise<void> {
  if (!userId || !docItem.id) return;
  try {
    const canvasRef = doc(db, 'users', userId, 'canvas', docItem.id);
    await setDoc(
      canvasRef,
      {
        id: docItem.id,
        userId,
        title: docItem.title || 'Untitled Document',
        language: docItem.language || 'markdown',
        content: docItem.content || '',
        updatedAt: docItem.lastModified || Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to sync canvas document to Firestore:', err);
  }
}

export async function fetchCanvasDocsFromCloud(userId: string): Promise<CanvasDocument[]> {
  if (!userId) return [];
  try {
    const canvasCol = collection(db, 'users', userId, 'canvas');
    const q = query(canvasCol, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: data.id || d.id,
        title: data.title,
        language: data.language,
        content: data.content,
        lastModified: data.updatedAt,
        version: 1,
      };
    });
  } catch (err) {
    console.warn('Failed to fetch canvas docs from Firestore:', err);
    return [];
  }
}

export async function deleteCanvasDocFromCloud(userId: string, docId: string): Promise<void> {
  if (!userId || !docId) return;
  try {
    const canvasRef = doc(db, 'users', userId, 'canvas', docId);
    await deleteDoc(canvasRef);
  } catch (err) {
    console.warn('Failed to delete canvas document from Firestore:', err);
  }
}
