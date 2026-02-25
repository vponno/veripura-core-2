// Test setup file
import '@testing-library/jest-dom';

// Mock Firebase
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ data: () => ({}) })),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(() => Promise.resolve()),
  getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.pdf')),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => () => Promise.resolve({ data: {} })),
}));

// Mock environment variables
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-key');
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-firebase-key');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
