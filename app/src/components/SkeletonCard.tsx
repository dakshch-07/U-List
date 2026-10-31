import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const SkeletonCard: React.FC = () => {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacityAnim]);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.imageSkeleton, { opacity: opacityAnim }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.priceSkeleton, { opacity: opacityAnim }]} />
        <Animated.View style={[styles.titleSkeleton, { opacity: opacityAnim }]} />
        <View style={styles.footer}>
          <Animated.View style={[styles.localitySkeleton, { opacity: opacityAnim }]} />
          <Animated.View style={[styles.dateSkeleton, { opacity: opacityAnim }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    overflow: 'hidden',
  },
  imageSkeleton: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#E2E8F0',
  },
  content: {
    padding: 10,
  },
  priceSkeleton: {
    width: '55%',
    height: 18,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  titleSkeleton: {
    width: '90%',
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  localitySkeleton: {
    width: '40%',
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  dateSkeleton: {
    width: '25%',
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
});
