import { Pressable, type PressableProps, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & { scale?: number };

export function AnimatedPressable({ scale = 0.97, style, onPressIn, onPressOut, ...rest }: Props) {
  const pressed = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      style={[animStyle, style]}
      onPressIn={(e) => {
        pressed.value = withSpring(scale, { damping: 18, stiffness: 320 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(1, { damping: 18, stiffness: 320 });
        onPressOut?.(e);
      }}
    />
  );
}

export const pressableCard = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
});
