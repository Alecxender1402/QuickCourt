/**
 * Sport Image Mapping Utility
 * Maps sport names to their corresponding image paths
 */

export interface SportImageMap {
  [key: string]: string;
}

export const SPORT_IMAGES: SportImageMap = {
  // Cricket variations
  cricket: "/cricket.jpg",

  // Football/Soccer variations
  football: "/football.jpg",
  soccer: "/football.jpg",

  // Badminton variations
  badminton: "/badminton.jpg",

  // Tennis variations
  tennis: "/tennis.avif",
  "lawn tennis": "/tennis.avif",

  // Table Tennis variations
  "table tennis": "/table_tennis.jpg",
  tabletennis: "/table_tennis.jpg",
  "ping pong": "/table_tennis.jpg",
  pingpong: "/table_tennis.jpg",
  tt: "/table_tennis.jpg",

  // Swimming variations
  swimming: "/swimming.webp",
  swim: "/swimming.webp",
  pool: "/swimming.webp",

  // Sports that need images (using placeholder for now)
  basketball: "/placeholder.svg",
  volleyball: "/placeholder.svg",
  vollyball: "/placeholder.svg", // Handle typo
  hockey: "/placeholder.svg",
  squash: "/placeholder.svg",
  gym: "/placeholder.svg",
  fitness: "/placeholder.svg",

  // Court types
  "indoor court": "/badminton.jpg", // Default indoor to badminton
  "outdoor court": "/football.jpg", // Default outdoor to football
};

/**
 * Get sport image for a given sport name with fuzzy matching
 */
export const getSportImage = (sportName: string): string => {
  if (!sportName) return "/placeholder.svg";

  const sportLower = sportName.toLowerCase();
  const sportKey = sportLower.replace(/\s+/g, "").replace(/[-_]/g, "");

  // Direct match
  if (SPORT_IMAGES[sportLower]) {
    return SPORT_IMAGES[sportLower];
  }

  // Match without spaces/dashes
  if (SPORT_IMAGES[sportKey]) {
    return SPORT_IMAGES[sportKey];
  }

  // Partial match for compound sports
  for (const [key, image] of Object.entries(SPORT_IMAGES)) {
    if (sportLower.includes(key) || key.includes(sportLower)) {
      return image;
    }
  }

  return "/placeholder.svg";
};

/**
 * Get sport image for venue based on available sports and amenities
 */
export const getVenueSportImage = (
  availableSports: string[] | string | null | undefined = [],
  amenities: string[] | string | null | undefined = [],
  venueName: string = "",
  venueDescription: string | null = ""
): string => {
  // Ensure we have arrays to work with
  const sportsArray = Array.isArray(availableSports)
    ? availableSports
    : availableSports
    ? [availableSports]
    : [];

  const amenitiesArray = Array.isArray(amenities)
    ? amenities
    : amenities
    ? [amenities]
    : [];

  const allSportsData = [...sportsArray, ...amenitiesArray];

  // Check all sports data for matches
  for (const sport of allSportsData) {
    const image = getSportImage(sport);
    if (image !== "/placeholder.svg") {
      return image;
    }
  }

  // Default fallback based on venue name or description
  const venueName_lower = venueName.toLowerCase();
  const venueDesc_lower = venueDescription?.toLowerCase() || "";

  for (const [key, image] of Object.entries(SPORT_IMAGES)) {
    if (venueName_lower.includes(key) || venueDesc_lower.includes(key)) {
      return image;
    }
  }

  return "/placeholder.svg";
};

/**
 * Get all available sport types with their corresponding images
 */
export const getAllSportsWithImages = (): Array<{
  name: string;
  image: string;
}> => {
  const uniqueSports = new Set<string>();
  const sportsWithImages: Array<{ name: string; image: string }> = [];

  // Get unique sports from the mapping
  Object.keys(SPORT_IMAGES).forEach((sport) => {
    const normalizedSport = sport.charAt(0).toUpperCase() + sport.slice(1);
    if (!uniqueSports.has(normalizedSport) && !sport.includes("court")) {
      uniqueSports.add(normalizedSport);
      sportsWithImages.push({
        name: normalizedSport,
        image: SPORT_IMAGES[sport],
      });
    }
  });

  return sportsWithImages.sort((a, b) => a.name.localeCompare(b.name));
};
