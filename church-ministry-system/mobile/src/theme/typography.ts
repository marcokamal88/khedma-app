import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  fontFamily,
  displayHero: {
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.9,
  },
  sectionHeading: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  button: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 1.0,
  },
};

export type AppTypography = typeof typography;
