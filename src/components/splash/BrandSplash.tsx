import { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";

type Props = {
  onFinish: () => void;
};

const { width: SW } = Dimensions.get("window");
const SPLASH_BRAND = require("../../../assets/tfw-splash-brand.png");
/** Logo + brand name only — tagline / roles are not baked into the PNG. */
const IMG_W = Math.min(SW * 0.84, 360);
const IMG_H = IMG_W * (307 / 452);

const TAGLINE_WORDS = ["One", "Platform", "for", "All"] as const;

export function BrandSplash({ onFinish }: Props) {
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const shellOpacity = useRef(new Animated.Value(1)).current;
  const wordAnims = useRef(TAGLINE_WORDS.map(() => new Animated.Value(0))).current;
  const dashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();

    const wordsIn = Animated.stagger(
      140,
      wordAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        })
      )
    );

    const dashesIn = Animated.timing(dashAnim, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    });

    const startTagline = setTimeout(() => {
      Animated.parallel([dashesIn, wordsIn]).start();
    }, 480);

    const finishTimer = setTimeout(() => {
      Animated.timing(shellOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, 3400);

    return () => {
      clearTimeout(startTagline);
      clearTimeout(finishTimer);
    };
  }, [cardScale, shellOpacity, wordAnims, dashAnim, onFinish]);

  return (
    <Animated.View style={[styles.root, { opacity: shellOpacity }]}>
      <View style={styles.center}>
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: cardScale }] }]}>
          <Image
            source={SPLASH_BRAND}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="TradeFair Wala"
          />
        </Animated.View>

        <View style={styles.taglineRow} accessibilityRole="text">
          <Animated.View style={[styles.dash, styles.dashLeft, { opacity: dashAnim }]} />
          {TAGLINE_WORDS.map((word, index) => (
            <Animated.Text
              key={word}
              style={[
                styles.word,
                {
                  opacity: wordAnims[index],
                  transform: [
                    {
                      translateY: wordAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {index === 0 ? word : ` ${word}`}
            </Animated.Text>
          ))}
          <Animated.View style={[styles.dash, styles.dashRight, { opacity: dashAnim }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },
  logoWrap: {
    width: IMG_W,
    height: IMG_H,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  logo: {
    width: IMG_W,
    height: IMG_H,
    backgroundColor: "#ffffff",
  },
  taglineRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  word: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  dash: {
    width: 18,
    height: 2,
    borderRadius: 1,
  },
  dashLeft: {
    marginRight: 10,
    backgroundColor: "#e11d2e",
  },
  dashRight: {
    marginLeft: 10,
    backgroundColor: "#0a1f3d",
  },
});
