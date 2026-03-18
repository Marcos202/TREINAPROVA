import { View, Text, Pressable } from 'react-native';

export { View, Text, Pressable };

export function Button({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="bg-blue-500 py-3 px-6 rounded-md active:bg-blue-600">
      <Text className="text-white font-bold text-center">{label}</Text>
    </Pressable>
  );
}
