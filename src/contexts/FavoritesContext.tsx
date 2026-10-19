import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { loadFavoriteIds, saveFavoriteIds } from '../services/storage';
import { useAuth } from './AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────

type FavoriteAction =
  | { type: 'hydrate'; ids: string[] }
  | { type: 'toggle'; id: string }
  | { type: 'clear' };

function favoriteReducer(state: string[], action: FavoriteAction): string[] {
  switch (action.type) {
    case 'hydrate':
      return action.ids;
    case 'toggle':
      return state.includes(action.id)
        ? state.filter((id) => id !== action.id)
        : [...state, action.id];
    case 'clear':
      return [];
  }
}

type FavoritesContextValue = {
  favoriteIds: string[];
  isHydrated: boolean;
  toggleFavorite: (id: string) => void;
  clearFavorites: () => void;
};

// ─── Context ─────────────────────────────────────────────────────────────

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, dispatch] = useReducer(favoriteReducer, []);
  const [isHydrated, setIsHydrated] = useState(false);
  const hydrated = useRef(false);
  // useAuth อาจยังไม่พร้อมตอน mount แรก (ครอบด้วย AuthProvider อยู่แล้วใน _layout)
  const { session } = useAuth();
  // ชื่อบัญชีจริง (คงที่) — ใช้แยกข้อมูล "บัญชีของใครของมัน"
  const account = session.status === 'authenticated' ? session.accountKey : null;
  const loadedAccount = useRef<string | null>(null);

  // Hydrate เมื่อรู้ว่าล็อกอินด้วยบัญชีไหน (และโหลดใหม่ทุกครั้งที่สลับบัญชี)
  useEffect(() => {
    if (!account) {
      // ยังไม่ล็อกอิน — เคลียร์ state กันข้อมูลบัญชีเก่าค้าง
      dispatch({ type: 'clear' });
      hydrated.current = false;
      setIsHydrated(true);
      loadedAccount.current = null;
      return;
    }
    if (loadedAccount.current === account) return; // บัญชีเดิม ไม่ต้องโหลดซ้ำ
    hydrated.current = false;
    loadFavoriteIds(account).then((ids) => {
      dispatch({ type: 'hydrate', ids });
      setIsHydrated(true);
      hydrated.current = true;
      loadedAccount.current = account;
    });
  }, [account]);

  // Save every time state changes (แต่ไม่บันทึกก่อน hydrate เสร็จ)
  useEffect(() => {
    if (!hydrated.current || !account) return;
    saveFavoriteIds(account, favoriteIds);
  }, [favoriteIds, account]);

  const toggleFavorite = (id: string) => dispatch({ type: 'toggle', id });
  const clearFavorites = () => dispatch({ type: 'clear' });

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, isHydrated, toggleFavorite, clearFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
