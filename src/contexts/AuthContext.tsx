import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  secureDelete,
  secureGet,
  secureSet,
} from '../services/secure-storage';

// ─── Types (Week 8) ───────────────────────────────────────────────────────

type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; accessToken: string; user: UserInfo; /** ชื่อบัญชีจริง (คงที่ ใช้เป็น key ของข้อมูลต่อบัญชี) */ accountKey: string; };

type UserInfo = {
  name: string;
  role: 'student' | 'organizer';
  /** URI รูปโปรไฟล์ (base64 data URI หรือ file URI) — ไม่บังคับ */
  photoUri?: string;
};

type AuthContextValue = {
  session: SessionState;
  login: (name: string, password: string) => Promise<void>;
  register: (name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** เปลี่ยนชื่อ“ที่แสดง” (ไม่เปลี่ยนชื่อบัญชีที่ใช้ล็อกอิน) */
  updateName: (newName: string) => Promise<void>;
  /** ตั้ง/เปลี่ยนรูปโปรไฟล์ (ส่ง URI ของรูป) */
  updatePhoto: (photoUri: string) => Promise<void>;
};

// ⚠️ SecureStore ยอมรับเฉพาะ key ที่มีตัวอักษร-ตัวเลข, '.', '-', '_' เท่านั้น
//    ห้ามใช้ '/' — จะ throw ทันทีบน native (iOS/Android)
const TOKEN_KEY = 'campus-events.access-token';
const NAME_KEY = 'campus-events.user-name'; // ชื่อที่แสดง (display name) — เปลี่ยนได้
const ACCOUNT_KEY = 'campus-events.account-name'; // ชื่อบัญชีจริง (คงที่ ใช้ล็อกอิน)
const USERS_KEY = 'campus-events.users'; // { [accountName]: { password, displayName? } } — mock user store
const PHOTO_KEY = 'campus-events.user-photo'; // URI รูปโปรไฟล์ (ต่อ session ล็อกอิน)

// ─── Context ─────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

type UserStore = Record<string, { password: string; displayName?: string }>;

async function loadUsers(): Promise<UserStore> {
  try {
    const raw = await secureGet(USERS_KEY);
    if (!raw) return {};
    const value: unknown = JSON.parse(raw);
    return typeof value === 'object' && value !== null ? (value as UserStore) : {};
  } catch {
    return {};
  }
}

async function saveUsers(users: UserStore): Promise<void> {
  await secureSet(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: 'loading' });

  // Restore session on mount (Week 8)
  useEffect(() => {
    Promise.all([secureGet(TOKEN_KEY), secureGet(ACCOUNT_KEY), secureGet(NAME_KEY), secureGet(PHOTO_KEY)])
      .then(([token, accountName, displayName, photoUri]) => {
        if (!token || !accountName) {
          setSession({ status: 'anonymous' });
          return;
        }
        setSession({
          status: 'authenticated',
          accessToken: token,
          accountKey: accountName,
          user: {
            name: displayName || accountName,
            role: 'student',
            ...(photoUri ? { photoUri } : {}),
          },
        });
      })
      .catch(() => setSession({ status: 'anonymous' }));
  }, []);

  /** ตั้งค่า session + เขียน storage หลัง login/register สำเร็จ */
  async function establishSession(accountName: string): Promise<void> {
    const users = await loadUsers();
    const account = users[accountName];
    const displayName = account?.displayName || accountName;
    const mockToken = `mock-token-${Date.now()}`;
    await secureSet(TOKEN_KEY, mockToken);
    await secureSet(ACCOUNT_KEY, accountName);
    await secureSet(NAME_KEY, displayName);
    const photoUri = await secureGet(PHOTO_KEY);
    setSession({
      status: 'authenticated',
      accessToken: mockToken,
      accountKey: accountName,
      user: {
        name: displayName,
        role: 'student',
        ...(photoUri ? { photoUri } : {}),
      },
    });
  }

  const login = useCallback(async (name: string, password: string) => {
    // Mock authentication (เปลี่ยนเป็น API call จริงใน Week 8 Lab)
    const users = await loadUsers();
    const account = users[name.trim()];
    if (!account || account.password !== password) {
      throw new Error('invalid-credentials');
    }
    await establishSession(name.trim());
  }, []);

  const register = useCallback(async (name: string, password: string) => {
    const trimmed = name.trim();
    const users = await loadUsers();
    if (users[trimmed]) {
      throw new Error('name-taken');
    }
    users[trimmed] = { password };
    await saveUsers(users);
    // สมัครเสร็จเข้าสู่ระบบทันที (display name = ชื่อบัญชี)
    await establishSession(trimmed);
  }, []);

  const updateName = useCallback(async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) throw new Error('name-required');
    if (session.status !== 'authenticated') throw new Error('not-authenticated');
    const accountName = session.accountKey;
    if (trimmed === session.user.name) return;

    // เปลี่ยนเฉพาะ display name — ชื่อบัญชี (ที่ใช้ล็อกอิน) และรหัสผ่านคงเดิม
    const users = await loadUsers();
    const account = users[accountName];
    if (account) {
      account.displayName = trimmed;
      await saveUsers(users);
    }

    await secureSet(NAME_KEY, trimmed);
    setSession((prev) =>
      prev.status === 'authenticated'
        ? { ...prev, user: { ...prev.user, name: trimmed } }
        : prev,
    );
  }, [session]);

  const updatePhoto = useCallback(async (photoUri: string) => {
    if (session.status !== 'authenticated') throw new Error('not-authenticated');
    await secureSet(PHOTO_KEY, photoUri);
    setSession((prev) =>
      prev.status === 'authenticated'
        ? { ...prev, user: { ...prev.user, photoUri } }
        : prev,
    );
  }, [session]);

  const logout = useCallback(async () => {
    await secureDelete(TOKEN_KEY);
    await secureDelete(NAME_KEY);
    await secureDelete(ACCOUNT_KEY);
    setSession({ status: 'anonymous' });
  }, []);

  return (
    <AuthContext.Provider value={{ session, login, register, logout, updateName, updatePhoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
