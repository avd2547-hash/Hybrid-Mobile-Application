import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TypeBadge from '../components/TypeBadge';
import { useFavorites } from '../contexts/FavoritesContext';
import {
  POKEAPI_BASE_URL,
  TYPE_COLORS,
  PokemonDetail,
} from '../constants/Pokemon';

const STAT_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'โจมตี',
  defense: 'ป้องกัน',
  'special-attack': 'โจมตีพิเศษ',
  'special-defense': 'ป้องกันพิเศษ',
  speed: 'ความเร็ว',
};

const STAT_COLORS: Record<string, string> = {
  hp: '#FF5959',
  attack: '#F5AC78',
  defense: '#FAE078',
  'special-attack': '#9DB7F5',
  'special-defense': '#A7DB8D',
  speed: '#FA92B2',
};

interface PokemonDetailModalProps {
  pokemonId: number | null;
  visible: boolean;
  onClose: () => void;
  onSelectType?: (type: string) => void;
}

export default function PokemonDetailModal({
  pokemonId,
  visible,
  onClose,
  onSelectType,
}: PokemonDetailModalProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pokemonId || !visible) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${POKEAPI_BASE_URL}/pokemon/${pokemonId}`);
        const data = await res.json();
        setPokemon(data);
      } catch (error) {
        console.error('Failed to fetch Pokemon detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [pokemonId, visible]);

  if (!visible) return null;

  const favorite = pokemonId ? isFavorite(pokemonId) : false;
  const primaryType = pokemon?.types[0]?.type.name || 'normal';
  const primaryColor = TYPE_COLORS[primaryType] || '#A8A77A';
  const displayName = pokemon
    ? pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)
    : '';
  const formattedId = pokemon ? `#${String(pokemon.id).padStart(3, '0')}` : '';

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#FFCB05" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{displayName || 'ข้อมูลโปเกมอน'}</Text>
          {pokemonId ? (
            <TouchableOpacity
              onPress={() => toggleFavorite(pokemonId)}
              style={styles.headerButton}
            >
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={26}
                color={favorite ? '#FFCB05' : 'rgba(255,255,255,0.7)'}
              />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFCB05" />
          </View>
        ) : !pokemon ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>ไม่สามารถโหลดข้อมูลได้</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Visual Hero Area */}
            <View style={[styles.heroCard, { backgroundColor: primaryColor + '25' }]}>
              <Text style={styles.heroId}>{formattedId}</Text>
              <Image
                source={{
                  uri:
                    pokemon.sprites.other?.['official-artwork']?.front_default ||
                    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
                }}
                style={styles.heroImage}
                resizeMode="contain"
              />
              <Text style={styles.heroName}>{displayName}</Text>

              {/* Types */}
              <View style={styles.typesRow}>
                {pokemon.types.map((t) => (
                  <TypeBadge
                    key={t.type.name}
                    type={t.type.name}
                    size="medium"
                    onPress={() => {
                      onClose();
                      onSelectType?.(t.type.name);
                    }}
                  />
                ))}
              </View>
            </View>

            {/* General Info (Weight / Height) */}
            <View style={styles.statsCard}>
              <Text style={styles.sectionTitle}>ข้อมูลทั่วไป</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoBox}>
                  <Text style={styles.infoValue}>{(pokemon.height / 10).toFixed(1)} ม.</Text>
                  <Text style={styles.infoLabel}>ความสูง</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoValue}>{(pokemon.weight / 10).toFixed(1)} กก.</Text>
                  <Text style={styles.infoLabel}>น้ำหนัก</Text>
                </View>
              </View>

              {/* Abilities */}
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>ความสามารถ (Abilities)</Text>
              <View style={styles.abilitiesRow}>
                {pokemon.abilities.map((a) => (
                  <View key={a.ability.name} style={styles.abilityBadge}>
                    <Text style={styles.abilityText}>
                      {a.ability.name} {a.is_hidden ? '(ซ่อน)' : ''}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Base Stats */}
              <Text style={[styles.sectionTitle, { marginTop: 22 }]}>ค่าพลังพื้นฐาน (Base Stats)</Text>
              <View style={styles.statsList}>
                {pokemon.stats.map((s) => {
                  const statName = STAT_NAMES[s.stat.name] || s.stat.name;
                  const statColor = STAT_COLORS[s.stat.name] || '#FFCB05';
                  const percentage = Math.min((s.base_stat / 200) * 100, 100);

                  return (
                    <View key={s.stat.name} style={styles.statRow}>
                      <Text style={styles.statLabel}>{statName}</Text>
                      <Text style={styles.statValue}>{s.base_stat}</Text>
                      <View style={styles.statBarBg}>
                        <View
                          style={[
                            styles.statBarFill,
                            { width: `${percentage}%`, backgroundColor: statColor },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1929',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1F3D',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFCB05',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  heroCard: {
    borderRadius: 24,
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroId: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  heroImage: {
    width: 170,
    height: 170,
    marginBottom: 10,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  typesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statsCard: {
    backgroundColor: '#1E2D4A',
    borderRadius: 20,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFCB05',
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  abilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  abilityBadge: {
    backgroundColor: 'rgba(255,203,5,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,203,5,0.3)',
  },
  abilityText: {
    color: '#FFCB05',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statsList: {
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    width: 85,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  statValue: {
    width: 35,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'right',
    marginRight: 10,
  },
  statBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
