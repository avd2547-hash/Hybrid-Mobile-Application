import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PokemonSearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
}

export default function PokemonSearchBar({
  searchQuery,
  onSearchChange,
}: PokemonSearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={20}
          color="#FFCB05"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="ค้นหาโปเกมอน..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            style={styles.clearButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,203,5,0.3)',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
});
