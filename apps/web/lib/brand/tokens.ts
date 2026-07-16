/**
 * Smeltr forge brand tokens — keep in sync with brand/SPECS.md and brand/README.md
 * Use in TSX when Tailwind arbitrary values are too scattered.
 */
export const forge = {
  bg: {
    deep: "#1A0C05",
    mid: "#2D1507",
    light: "#3D1F08",
  },
  amber: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    900: "#78350F",
  },
  text: {
    onDark: "#FDE68A",
    onDarkHeading: "#FEF3C7",
    onDarkMuted: "#D97706",
  },
} as const;

export const brandAssets = {
  logoMark: "/logo-mark.svg",
  logo: "/logo.svg",
  ogImage: "/og-image.png",
  profilePhoto: "/profile-photo.png",
} as const;
