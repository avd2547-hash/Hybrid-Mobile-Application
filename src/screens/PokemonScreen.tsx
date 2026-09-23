import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PokemonSearchBar from '../components/PokemonSearchBar';
import PokemonCard from '../components/PokemonCard';
import EmptyState from '../components/EmptyState';
import PokemonDetailModal from '../components/PokemonDetailModal';
import TypeBadge from '../components/TypeBadge';
import { useFavorites } from '../contexts/FavoritesContext';
import {
  POKEAPI_BASE_URL,
  getPokemonImageUrl,
  PokemonListItem,
  ALL_TYPES,
  TYPE_NAMES_TH,
} from '../constants/Pokemon';

export default function PokemonScreen() {
  const { favorites } = useFavorites();
  const [subTab, setSubTab] = useState<'all' | 'favorites'>('all');
  const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);

  // Fetch Pokemon List
  const fetchPokemon = useCallback(async () => {
    try {
      const listRes = await fetch(`${POKEAPI_BASE_URL}/pokemon?limit=151`);
      const listData = await listRes.json();

      const basicList: PokemonListItem[] = listData.results.map(
        (p: { name: string; url: string }, index: number) => {
          const id = index + 1;
          return {
            id,
            name: p.name,
            url: p.url,
            image: getPokemonImageUrl(id),
            types: [],
          };
        }
      );

      const batchSize = 30;
      const allPokemon = [...basicList];

      for (let i = 0; i < allPokemon.length; i += batchSize) {
        const batch = allPokemon.slice(i, i + batchSize);
        const detailPromises = batch.map(async (p) => {
          try {
            const res = await fetch(`${POKEAPI_BASE_URL}/pokemon/${p.id}`);
            const data = await res.json();
            return {
              ...p,
              types: data.types.map((t: { type: { name: string } }) => t.type.name),
            };
          } catch {
            return p;
          }
        });

        const results = await Promise.all(detailPromises);
        results.forEach((result, idx) => {
          allPokemon[i + idx] = result;
        });
      }

      setPokemonList(allPokemon);
    } catch (error) {
      console.error('Failed to fetch Pokemon:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPokemon();
  }, [fetchPokemon]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPokemon();
  }, [fetchPokemon]);

  // Filtered List
  const displayedList = useMemo(() => {
    let list = pokemonList;

    if (subTab === 'favorites') {
      list = list.filter((p) => favorites.includes(p.id));
    }

    if (selectedType) {
      list = list.filter((p) => p.types?.includes(selectedType));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    return list;
  }, [pokemonList, subTab, favorites, selectedType, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>⚡ Pokédex สารานุกรมโปเกมอน</Text>
        </View>

        {/* Sub-tabs: All vs Favorites */}
        <View style={styles.tabSwitch}>
          <TouchableOpacity
            style={[styles.switchBtn, subTab === 'all' && styles.switchBtnActive]}
            onPress={() => setSubTab('all')}
          >
            <Text style={[styles.switchText, subTab === 'all' && styles.switchTextActive]}>
              โปเกมอนทั้งหมด (151)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchBtn, subTab === 'favorites' && styles.switchBtnActive]}
            onPress={() => setSubTab('favorites')}
          >
            <Ionicons
              name="heart"
              size={14}
              color={subTab === 'favorites' ? '#FFCB05' : '#8B9BB4'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.switchText, subTab === 'favorites' && styles.switchTextActive]}>
              รายการโปรด ({favorites.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <PokemonSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Type Filter Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeScroll}
        >
          <TouchableOpacity
            style={[styles.allTypeChip, !selectedType && styles.allTypeChipActive]}
            onPress={() => setSelectedType(null)}
          >
            <Text style={[styles.allTypeText, !selectedType && styles.allTypeTextActive]}>
              ทั้งหมด
            </Text>
          </TouchableOpacity>
          {ALL_TYPES.map((type) => {
            const isSelected = selectedType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(isSelected ? null : type)}
                style={[styles.typeFilterItem, isSelected && styles.typeFilterItemActive]}
              >
                <TypeBadge type={type} size="small" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFCB05" />
          <Text style={styles.loadingText}>กำลังดาวน์โหลดข้อมูลโปเกมอน...</Text>
        </View>
      ) : displayedList.length === 0 ? (
        <EmptyState
          title={subTab === 'favorites' ? 'ยังไม่มีรายการโปรด' : 'ไม่พบโปเกมอน'}
          message={
            subTab === 'favorites'
              ? 'แตะไอคอนหัวใจที่การ์ดเพื่อเก็บโปเกมอนตัวโปรดไว้ที่นี่'
              : 'ลองค้นหาด้วยชื่ออื่น หรือล้างตัวกรองชนิด'
          }
          icon={subTab === 'favorites' ? 'heart-dislike-outline' : 'search-outline'}
        />
      ) : (
        <FlatList
          data={displayedList}
          renderItem={({ item }) => (
            <PokemonCard
              pokemon={item}
              onPress={() => setSelectedPokemonId(item.id)}
              onTypePress={(type) => setSelectedType(type)}
            />
          )}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFCB05"
            />
          }
        />
      )}

      {/* Detail Modal */}
      <PokemonDetailModal
        pokemonId={selectedPokemonId}
        visible={selectedPokemonId !== null}
        onClose={() => setSelectedPokemonId(null)}
        onSelectType={(t) => setSelectedType(t)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1929',
  },
  header: {
    backgroundColor: '#0F1F3D',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitleRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFCB05',
  },
  tabSwitch: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 4,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  switchBtnActive: {
    backgroundColor: '#1E2D4A',
  },
  switchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B9BB4',
  },
  switchTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  typeScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  allTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  allTypeChipActive: {
    borderColor: '#FFCB05',
    backgroundColor: 'rgba(255,203,5,0.15)',
  },
  allTypeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  allTypeTextActive: {
    color: '#FFCB05',
  },
  typeFilterItem: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeFilterItemActive: {
    borderColor: '#FFCB05',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFCB05',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
});
