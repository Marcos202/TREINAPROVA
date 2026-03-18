import { View, Text, Button } from '@treina-prova/ui';
import "./global.css";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-slate-900">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Treina Prova Mobile
      </Text>
      <Button label="Click Me" onPress={() => console.log('Pressed')} />
    </View>
  );
}
