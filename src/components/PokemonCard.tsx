import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPE_COLORS, PokemonListItem } from '../constants/Pokemon';
import { useFavorites } from '../contexts/FavoritesContext';
import TypeBadge from './TypeBadge';

interface PokemonCardProps {
  pokemon: PokemonListItem;
  onPress?: () => void;
  onTypePress?: (type: string) => void;
}

export default function PokemonCard({ pokemon, onPress, onTypePress }: PokemonCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(pokemon.id);

  const displayName =
    pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
  const formattedId = `#${String(pokemon.id).padStart(3, '0')}`;

  const primaryType = pokemon.types?.[0];
  const tintColor = primaryType ? TYPE_COLORS[primaryType] : '#A8A77A';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.bgAccent, { backgroundColor: tintColor }]} />
      <View style={styles.bgAccentOverlay} />

      <TouchableOpacity
        style={styles.heartButton}
        onPress={() => toggleFavorite(pokemon.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.6}
      >
        <Ionicons
          name={favorite ? 'heart' : 'heart-outline'}
          size={22}
          color={favorite ? '#FFCB05' : 'rgba(255,255,255,0.5)'}
        />
      </TouchableOpacity>

      <Text style={styles.pokemonId}>{formattedId}</Text>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: pokemon.image }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {displayName}
      </Text>

      {pokemon.types && pokemon.types.length > 0 && (
        <View style={styles.typesContainer}>
          {pokemon.types.map((type) => (
            <TypeBadge
              key={type}
              type={type}
              size="small"
              onPress={onTypePress ? () => onTypePress(type) : undefined}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E2D4A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bgAccent: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.35,
  },
  bgAccentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  pokemonId: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
  },
  imageContainer: {
    width: 84,
    height: 84,
    marginTop: 14,
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
});
