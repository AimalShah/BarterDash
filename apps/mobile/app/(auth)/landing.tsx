import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Repeat2 } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

export default function LandingScreen() {
  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.pattern} />
      <View style={styles.centerGlow} />

      <View style={styles.content}>
        <View style={styles.topSpacer} />

        <View style={styles.brandSection}>
          <View style={styles.logoShell}>
            <LinearGradient
              colors={[COLORS.primaryBlue, COLORS.blueLavender]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Repeat2 size={54} color="#FFFFFF" strokeWidth={2.2} />
            </LinearGradient>
          </View>

          <Text style={styles.brand}>BarterDash Live</Text>
          <Text style={styles.tagline}>Trade in real-time</Text>
        </View>

        <View style={styles.bottomBlock}>
          {/* <View style={styles.progressHead}> */}
          {/*   <Text style={styles.progressLabel}>INITIALIZING</Text> */}
          {/*   <Text style={styles.progressValue}>100%</Text> */}
          {/* </View> */}
          {/* <View style={styles.progressTrack}> */}
          {/*   <View style={styles.progressFill} /> */}
          {/* </View> */}

          <Pressable style={styles.primaryBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.primaryBtnText}>Login</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.secondaryBtnText}>Create account</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  pattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
    backgroundColor: '#F5F7F8',
  },
  centerGlow: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 420,
    height: 420,
    marginLeft: -210,
    marginTop: -210,
    borderRadius: 220,
    backgroundColor: '#BFDBFE',
    opacity: 0.35,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 14,
  },
  topSpacer: {
    flex: 1,
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoShell: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#C7DAFB',
    padding: 10,
  },
  logoGradient: {
    height: 112,
    width: 112,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    marginTop: 22,
    color: COLORS.primaryText,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 8,
    color: COLORS.lightGrey,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bottomBlock: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  progressValue: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#DFE7F4',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryBlue,
  },
  primaryBtn: {
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: COLORS.primaryBlue,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C9D8F5',
    backgroundColor: '#FFFFFF',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: '700',
  },
});
