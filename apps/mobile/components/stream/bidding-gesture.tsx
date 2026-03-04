import { useEffect, useState, useRef } from "react";
import { View, Text } from "react-native"
import {
  GestureDetector,
  Gesture,
  Directions,
} from "react-native-gesture-handler"
import Animated, { useSharedValue, useAnimatedStyle, withSpring, cancelAnimation } from "react-native-reanimated"
import { runOnJS } from "react-native-worklets";

export default function BiddingControls({ currentBid }: { currentBid: number; }) {

  const [bidConfirmend, setBidConfirmed] = useState(false)
  const translateX = useSharedValue(0);
  const parentWidth = useSharedValue(0);
  console.log("swiped")
  const buttonWidth = useSharedValue(0);

  useEffect(() => {
    return () => {
      cancelAnimation(translateX)
    }
  }, [])


  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }))

  const onReachEnd = () => {
    setBidConfirmed(true)
    console.log("Bid confirmed");
  }

  const resetPosition = () => {
    setBidConfirmed(false)
    translateX.value = withSpring(0)
  }


  const rightSwipeGesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      "worklet"
      const maxSlide = parentWidth.value - buttonWidth.value - 8
      translateX.value = withSpring(maxSlide, {}, (finished) => {
        if (finished) {
          runOnJS(onReachEnd)()
          runOnJS(resetPosition)()

        }
      })
    })

  return (
    <View className="flex flex-row gap-4 mt-4 z-20">
      <View className="border border-white  justify-center items-center rounded-full">
        <Text className="text-white font-bold px-6 py-0">Custom</Text>
      </View>

      <View
        className="border flex-1 justify-start p-1 items-start border-yellow-400 rounded-full z-40"
        onLayout={(e) => {
          parentWidth.value = e.nativeEvent.layout.width
        }}
      >{
          !bidConfirmend ? (
            <GestureDetector gesture={rightSwipeGesture}>
              <Animated.View
                className="z-40"
                style={animatedStyle}
                onLayout={(e) => {
                  buttonWidth.value = e.nativeEvent.layout.width
                }}
              >
                <Text className="bg-yellow-400 text-black px-6 py-4 rounded-full font-bold ">Bid : ${currentBid}</Text>
              </Animated.View>
            </GestureDetector>) : <Text>Bid Confirmed</Text>
        }
      </View>
    </View>
  )
}
