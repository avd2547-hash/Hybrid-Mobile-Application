import AsyncStorage from '@react-native-async-storage/async-storage';

// Web stub — expo-secure-store ไม่รองรับ web จึงใช้ AsyncStorage (localStorage) แทน
export async function secureGet(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function secureSet(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function secureDelete(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
