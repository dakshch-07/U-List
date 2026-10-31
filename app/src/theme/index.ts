export const theme = {
  colors: {
    primary: '#D9480F',
    text: '#1B1B1B',
    secondaryText: '#6B6B6B',
    border: '#E3E3E3',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    success: '#1E8E3E',
    error: '#D93025',
    featuredTagBg: '#FFC107',
    featuredTagText: '#1B1B1B',
  },
  typography: {
    size: {
      caption: 12,
      body: 14,
      subheading: 16,
      heading: 20,
      title: 24,
    },
    weight: {
      regular: '400' as const,
      medium: '500' as const,
      bold: '700' as const,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 6,
    lg: 8,
  },
};
