// Pokemon type colors for badges
export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

// Thai type names
export const TYPE_NAMES_TH: Record<string, string> = {
  normal: 'ปกติ',
  fire: 'ไฟ',
  water: 'น้ำ',
  electric: 'ไฟฟ้า',
  grass: 'พืช',
  ice: 'น้ำแข็ง',
  fighting: 'ต่อสู้',
  poison: 'พิษ',
  ground: 'ดิน',
  flying: 'บิน',
  psychic: 'จิต',
  bug: 'แมลง',
  rock: 'หิน',
  ghost: 'ผี',
  dragon: 'มังกร',
  dark: 'ความมืด',
  steel: 'เหล็ก',
  fairy: 'แฟรี่',
};

// All Pokemon types for filter
export const ALL_TYPES = Object.keys(TYPE_COLORS);

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

export function getPokemonImageUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function getPokemonSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export interface PokemonListItem {
  id: number;
  name: string;
  url: string;
  types?: string[];
  image: string;
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  sprites: {
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}
