import { Easing, FadeInUp } from 'react-native-reanimated';

export function cardEnter(index = 0) {
  return FadeInUp.duration(560)
    .delay(40 + index * 55)
    .easing(Easing.out(Easing.cubic));
}
