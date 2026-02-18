import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

const BASE_SCREEN_WIDTH = 390;
const SMALL_PHONE_BREAKPOINT = 360;
const LARGE_PHONE_BREAKPOINT = 430;
const TABLET_BREAKPOINT = 768;
const LARGE_TABLET_BREAKPOINT = 1024;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const getHorizontalPadding = (screenWidth: number) => {
  if (screenWidth >= LARGE_TABLET_BREAKPOINT) return 40;
  if (screenWidth >= TABLET_BREAKPOINT) return 32;
  if (screenWidth >= LARGE_PHONE_BREAKPOINT) return 24;
  if (screenWidth >= SMALL_PHONE_BREAKPOINT) return 20;
  return 16;
};

export const getResponsiveFontSize = (
  baseSize: number,
  screenWidth: number,
  minScale = 0.9,
  maxScale = 1.2
) => baseSize * clamp(screenWidth / BASE_SCREEN_WIDTH, minScale, maxScale);

export const getGridColumns = (
  screenWidth: number,
  {
    minItemWidth = 160,
    maxColumns = 4,
    horizontalPadding = getHorizontalPadding(screenWidth),
    gap = 16,
  }: {
    minItemWidth?: number;
    maxColumns?: number;
    horizontalPadding?: number;
    gap?: number;
  } = {}
) => {
  const availableWidth = Math.max(
    screenWidth - horizontalPadding * 2,
    minItemWidth
  );
  const calculated = Math.floor((availableWidth + gap) / (minItemWidth + gap));
  return clamp(calculated, 1, maxColumns);
};

export const getGridItemWidth = ({
  screenWidth,
  columns,
  horizontalPadding,
  gap,
}: {
  screenWidth: number;
  columns: number;
  horizontalPadding: number;
  gap: number;
}) => {
  const availableWidth = screenWidth - horizontalPadding * 2;
  return (availableWidth - gap * (columns - 1)) / columns;
};

export const useResponsiveLayout = () => {
  const { width, height, fontScale } = useWindowDimensions();

  return useMemo(() => {
    const isSmallPhone = width < SMALL_PHONE_BREAKPOINT;
    const isTablet = width >= TABLET_BREAKPOINT;
    const isLargeTablet = width >= LARGE_TABLET_BREAKPOINT;
    const isLandscape = width > height;

    const horizontalPadding = getHorizontalPadding(width);
    const cardGap = isTablet ? 20 : 12;
    const contentMaxWidth = isLargeTablet ? 1120 : isTablet ? 960 : width;
    const contentWidth = Math.min(width - horizontalPadding * 2, contentMaxWidth);
    const spacingScale = clamp(width / BASE_SCREEN_WIDTH, 0.9, 1.25);

    return {
      width,
      height,
      fontScale,
      isSmallPhone,
      isTablet,
      isLargeTablet,
      isLandscape,
      horizontalPadding,
      cardGap,
      contentMaxWidth,
      contentWidth,
      spacingScale,
      scaledFont: (
        baseSize: number,
        minScale = 0.9,
        maxScale = isTablet ? 1.3 : 1.15
      ) => getResponsiveFontSize(baseSize, width, minScale, maxScale),
      getColumns: (minItemWidth = 160, maxColumns = isTablet ? 3 : 2, gap = cardGap) =>
        getGridColumns(width, {
          minItemWidth,
          maxColumns,
          horizontalPadding,
          gap,
        }),
      getItemWidth: (columns: number, gap = cardGap) =>
        getGridItemWidth({
          screenWidth: width,
          columns,
          horizontalPadding,
          gap,
        }),
    };
  }, [width, height, fontScale]);
};
