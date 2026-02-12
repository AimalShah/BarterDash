import { useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

interface Reaction {
  id: number;
  x: number;
  y: Animated.Value;
  opacity: Animated.Value;
  emoji: string;
}

interface UseReactionSystemReturn {
  reactions: Reaction[];
  addReaction: (emoji?: string) => void;
  renderReactions: () => JSX.Element;
}

export function useReactionSystem(): UseReactionSystemReturn {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const reactionIdRef = useRef(0);

  const addReaction = useCallback((emoji: string = "❤️") => {
    const newReaction: Reaction = {
      id: reactionIdRef.current++,
      x: Math.random() * 60 - 30,
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
      emoji,
    };

    setReactions((prev) => [...prev, newReaction]);

    Animated.parallel([
      Animated.timing(newReaction.y, {
        toValue: -120,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(newReaction.opacity, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    });
  }, []);

  const renderReactions = () => (
    <View style={styles.reactionsContainer} pointerEvents="none">
      {reactions.map((r) => (
        <Animated.View
          key={r.id}
          style={[
            styles.reaction,
            {
              transform: [{ translateX: r.x }, { translateY: r.y }],
              opacity: r.opacity,
            },
          ]}
        >
          <Text style={styles.reactionEmoji}>{r.emoji}</Text>
        </Animated.View>
      ))}
    </View>
  );

  return {
    reactions,
    addReaction,
    renderReactions,
  };
}

export function ReactionButton({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.reactionContainer}>
      <TouchableOpacity style={styles.reactionButton} onPress={onPress}>
        <Text style={styles.reactionButtonText}>❤️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  reactionsContainer: {
    position: "absolute",
    bottom: 140,
    right: 16,
    zIndex: 30,
    pointerEvents: "none",
  },
  reaction: {
    position: "absolute",
    bottom: 0,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  reactionContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.overlayMedium,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  reactionButtonText: {
    fontSize: 20,
  },
});
