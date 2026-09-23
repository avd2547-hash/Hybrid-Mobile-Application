import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export type FilterId = 'original' | 'mono' | 'vivid';

export type FilterDefinition = {
  id: FilterId;
  name: string;
  hint: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const FILTERS: FilterDefinition[] = [
  { id: 'original', name: 'Natural', hint: 'สีจริง', accent: '#BEE3E6', icon: 'leaf-outline' },
  { id: 'mono', name: 'Mono', hint: 'ขาวดำ', accent: '#5B6775', icon: 'contrast-outline' },
  { id: 'vivid', name: 'Pop', hint: 'สีสดชัด', accent: '#FFB36B', icon: 'sunny-outline' },
];

const MONO_MATRIX = [
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0, 0, 0, 1, 0,
];

const VIVID_MATRIX = [
  1.28, 0.04, 0.01, 0, 0,
  0.03, 1.18, 0.03, 0, 0,
  0.01, 0.04, 1.24, 0, 0,
  0, 0, 0, 1, 0,
];

export async function processPhoto(uri: string, filter: FilterId): Promise<string> {
  if (filter === 'original') return uri;

  // Resizing image to keep memory low
  const prepared = await manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.9, format: SaveFormat.JPEG }
  );

  try {
    // Dynamically attempt to use Skia if available
    const { Skia, FilterMode, MipmapMode, ImageFormat } = require('@shopify/react-native-skia');
    const FileSystem = require('expo-file-system');

    const data = await Skia.Data.fromURI(prepared.uri);
    const source = Skia.Image.MakeImageFromEncoded(data);
    if (!source) {
      data.dispose();
      return prepared.uri;
    }

    const surface = Skia.Surface.MakeOffscreen(source.width(), source.height());
    if (!surface) {
      source.dispose();
      data.dispose();
      return prepared.uri;
    }

    const paint = Skia.Paint();
    let output: any = null;

    try {
      paint.setColorFilter(
        Skia.ColorFilter.MakeMatrix(filter === 'mono' ? MONO_MATRIX : VIVID_MATRIX)
      );

      surface.getCanvas().drawImageRectOptions(
        source,
        { x: 0, y: 0, width: source.width(), height: source.height() },
        { x: 0, y: 0, width: source.width(), height: source.height() },
        FilterMode.Linear,
        MipmapMode.None,
        paint
      );
      surface.flush();

      output = surface.makeImageSnapshot();
      const bytes = output.encodeToBytes(ImageFormat.JPEG, 90);
      
      const fileName = `prism-${filter}-${Date.now()}.jpg`;
      const targetUri = `${FileSystem.cacheDirectory || ''}${fileName}`;
      
      if (FileSystem.File) {
        const fileObj = new FileSystem.File(FileSystem.Paths.cache, fileName);
        fileObj.create({ overwrite: true, intermediates: true });
        fileObj.write(bytes);
        return fileObj.uri;
      } else {
        await FileSystem.writeAsStringAsync(targetUri, bytes.toString(), {
          encoding: FileSystem.EncodingType?.Base64 || 'utf8',
        });
        return targetUri;
      }
    } finally {
      output?.dispose();
      paint.dispose();
      source.dispose();
      data.dispose();
      surface.dispose();
    }
  } catch (err) {
    console.warn('Skia filter fallback, returning resized image:', err);
    return prepared.uri;
  }
}
