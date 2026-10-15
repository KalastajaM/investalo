export interface CityMarketData {
  city: string;
  pricePerSqm: { low: number; mid: number; high: number };
  rentPerSqm: { low: number; mid: number; high: number };
  maintenancePerSqm: { low: number; mid: number; high: number };
  areas?: Record<string, {
    pricePerSqm: { low: number; mid: number; high: number };
    rentPerSqm?: { low: number; mid: number; high: number };
  }>;
}

const finnishMarketData: Record<string, CityMarketData> = {
  helsinki: {
    city: "Helsinki",
    pricePerSqm: { low: 2800, mid: 4200, high: 7500 },
    rentPerSqm: { low: 18, mid: 24, high: 35 },
    maintenancePerSqm: { low: 3.5, mid: 5.0, high: 7.0 },
    areas: {
      kallio: { pricePerSqm: { low: 3500, mid: 5000, high: 6500 }, rentPerSqm: { low: 22, mid: 28, high: 34 } },
      sörnäinen: { pricePerSqm: { low: 3000, mid: 4200, high: 5500 }, rentPerSqm: { low: 20, mid: 26, high: 32 } },
      vallila: { pricePerSqm: { low: 3200, mid: 4500, high: 6000 }, rentPerSqm: { low: 21, mid: 27, high: 33 } },
      töölö: { pricePerSqm: { low: 4500, mid: 6000, high: 8500 }, rentPerSqm: { low: 24, mid: 30, high: 38 } },
      kamppi: { pricePerSqm: { low: 4500, mid: 6500, high: 9000 }, rentPerSqm: { low: 25, mid: 32, high: 40 } },
      kruununhaka: { pricePerSqm: { low: 5000, mid: 7000, high: 10000 }, rentPerSqm: { low: 25, mid: 32, high: 40 } },
      punavuori: { pricePerSqm: { low: 4500, mid: 6500, high: 9000 }, rentPerSqm: { low: 24, mid: 30, high: 38 } },
      ullanlinna: { pricePerSqm: { low: 5000, mid: 7500, high: 11000 }, rentPerSqm: { low: 26, mid: 33, high: 42 } },
      herttoniemi: { pricePerSqm: { low: 2500, mid: 3500, high: 5000 }, rentPerSqm: { low: 17, mid: 22, high: 28 } },
      lauttasaari: { pricePerSqm: { low: 3800, mid: 5200, high: 7000 }, rentPerSqm: { low: 22, mid: 27, high: 34 } },
      munkkiniemi: { pricePerSqm: { low: 3500, mid: 5000, high: 7000 }, rentPerSqm: { low: 21, mid: 26, high: 33 } },
      kontula: { pricePerSqm: { low: 1500, mid: 2200, high: 3200 }, rentPerSqm: { low: 14, mid: 18, high: 23 } },
      mellunmäki: { pricePerSqm: { low: 1400, mid: 2000, high: 3000 }, rentPerSqm: { low: 13, mid: 17, high: 22 } },
      vuosaari: { pricePerSqm: { low: 2000, mid: 3000, high: 4200 }, rentPerSqm: { low: 16, mid: 21, high: 26 } },
      malmi: { pricePerSqm: { low: 1800, mid: 2800, high: 4000 }, rentPerSqm: { low: 15, mid: 20, high: 25 } },
      pitäjänmäki: { pricePerSqm: { low: 2500, mid: 3500, high: 4800 }, rentPerSqm: { low: 17, mid: 22, high: 28 } },
      pasila: { pricePerSqm: { low: 3000, mid: 4200, high: 5800 }, rentPerSqm: { low: 20, mid: 25, high: 31 } },
      arabia: { pricePerSqm: { low: 3000, mid: 4200, high: 5500 }, rentPerSqm: { low: 20, mid: 26, high: 32 } },
      jätkäsaari: { pricePerSqm: { low: 4500, mid: 6000, high: 7500 }, rentPerSqm: { low: 23, mid: 29, high: 36 } },
      kalasatama: { pricePerSqm: { low: 4000, mid: 5500, high: 7000 }, rentPerSqm: { low: 22, mid: 28, high: 34 } },
    },
  },
  espoo: {
    city: "Espoo",
    pricePerSqm: { low: 2200, mid: 3500, high: 5500 },
    rentPerSqm: { low: 16, mid: 21, high: 28 },
    maintenancePerSqm: { low: 3.5, mid: 4.8, high: 6.5 },
    areas: {
      tapiola: { pricePerSqm: { low: 3200, mid: 4500, high: 6500 }, rentPerSqm: { low: 20, mid: 25, high: 32 } },
      leppävaara: { pricePerSqm: { low: 2800, mid: 4000, high: 5500 }, rentPerSqm: { low: 18, mid: 23, high: 29 } },
      matinkylä: { pricePerSqm: { low: 2500, mid: 3600, high: 5000 }, rentPerSqm: { low: 17, mid: 22, high: 28 } },
      espoonlahti: { pricePerSqm: { low: 2000, mid: 3000, high: 4200 }, rentPerSqm: { low: 15, mid: 20, high: 25 } },
      otaniemi: { pricePerSqm: { low: 3000, mid: 4200, high: 5800 }, rentPerSqm: { low: 19, mid: 24, high: 30 } },
      kivenlahti: { pricePerSqm: { low: 2000, mid: 3000, high: 4000 }, rentPerSqm: { low: 15, mid: 19, high: 24 } },
    },
  },
  vantaa: {
    city: "Vantaa",
    pricePerSqm: { low: 1800, mid: 2800, high: 4200 },
    rentPerSqm: { low: 14, mid: 19, high: 25 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
    areas: {
      tikkurila: { pricePerSqm: { low: 2200, mid: 3200, high: 4500 }, rentPerSqm: { low: 16, mid: 21, high: 27 } },
      myyrmäki: { pricePerSqm: { low: 1800, mid: 2800, high: 3800 }, rentPerSqm: { low: 14, mid: 19, high: 24 } },
      korso: { pricePerSqm: { low: 1300, mid: 2000, high: 3000 }, rentPerSqm: { low: 12, mid: 16, high: 21 } },
      martinlaakso: { pricePerSqm: { low: 1800, mid: 2600, high: 3600 }, rentPerSqm: { low: 14, mid: 19, high: 24 } },
      aviapolis: { pricePerSqm: { low: 2500, mid: 3500, high: 4500 }, rentPerSqm: { low: 17, mid: 22, high: 28 } },
    },
  },
  tampere: {
    city: "Tampere",
    pricePerSqm: { low: 1800, mid: 2800, high: 4500 },
    rentPerSqm: { low: 14, mid: 18, high: 25 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
    areas: {
      keskusta: { pricePerSqm: { low: 2500, mid: 3800, high: 5500 }, rentPerSqm: { low: 17, mid: 22, high: 28 } },
      hervanta: { pricePerSqm: { low: 1300, mid: 2000, high: 3200 }, rentPerSqm: { low: 12, mid: 16, high: 21 } },
      kaleva: { pricePerSqm: { low: 2200, mid: 3200, high: 4500 }, rentPerSqm: { low: 16, mid: 20, high: 26 } },
      pyynikki: { pricePerSqm: { low: 2500, mid: 3600, high: 5000 }, rentPerSqm: { low: 17, mid: 22, high: 28 } },
      lielahti: { pricePerSqm: { low: 1500, mid: 2400, high: 3500 }, rentPerSqm: { low: 13, mid: 17, high: 22 } },
      härmälä: { pricePerSqm: { low: 1600, mid: 2500, high: 3600 }, rentPerSqm: { low: 14, mid: 18, high: 23 } },
    },
  },
  turku: {
    city: "Turku",
    pricePerSqm: { low: 1500, mid: 2400, high: 4000 },
    rentPerSqm: { low: 13, mid: 17, high: 23 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
    areas: {
      keskusta: { pricePerSqm: { low: 2200, mid: 3200, high: 4800 }, rentPerSqm: { low: 16, mid: 21, high: 27 } },
      runosmäki: { pricePerSqm: { low: 900, mid: 1500, high: 2500 }, rentPerSqm: { low: 10, mid: 14, high: 18 } },
      varissuo: { pricePerSqm: { low: 800, mid: 1300, high: 2200 }, rentPerSqm: { low: 9, mid: 13, high: 17 } },
      martti: { pricePerSqm: { low: 2000, mid: 3000, high: 4200 }, rentPerSqm: { low: 15, mid: 19, high: 25 } },
      kupittaa: { pricePerSqm: { low: 2000, mid: 3000, high: 4500 }, rentPerSqm: { low: 15, mid: 20, high: 26 } },
    },
  },
  oulu: {
    city: "Oulu",
    pricePerSqm: { low: 1200, mid: 2000, high: 3500 },
    rentPerSqm: { low: 11, mid: 15, high: 20 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
    areas: {
      keskusta: { pricePerSqm: { low: 1800, mid: 2800, high: 4000 }, rentPerSqm: { low: 14, mid: 18, high: 24 } },
      tuira: { pricePerSqm: { low: 1200, mid: 2000, high: 3000 }, rentPerSqm: { low: 11, mid: 15, high: 20 } },
      linnanmaa: { pricePerSqm: { low: 1400, mid: 2200, high: 3200 }, rentPerSqm: { low: 12, mid: 16, high: 21 } },
      kaijonharju: { pricePerSqm: { low: 1000, mid: 1600, high: 2500 }, rentPerSqm: { low: 10, mid: 14, high: 18 } },
    },
  },
  jyväskylä: {
    city: "Jyväskylä",
    pricePerSqm: { low: 1200, mid: 2000, high: 3200 },
    rentPerSqm: { low: 12, mid: 16, high: 22 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
    areas: {
      keskusta: { pricePerSqm: { low: 1800, mid: 2800, high: 4000 }, rentPerSqm: { low: 15, mid: 20, high: 26 } },
      kuokkala: { pricePerSqm: { low: 1200, mid: 2000, high: 3000 }, rentPerSqm: { low: 12, mid: 16, high: 21 } },
    },
  },
  kuopio: {
    city: "Kuopio",
    pricePerSqm: { low: 1200, mid: 2000, high: 3200 },
    rentPerSqm: { low: 11, mid: 15, high: 21 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
    areas: {
      keskusta: { pricePerSqm: { low: 1800, mid: 2600, high: 3800 }, rentPerSqm: { low: 14, mid: 18, high: 24 } },
      petonen: { pricePerSqm: { low: 900, mid: 1500, high: 2200 }, rentPerSqm: { low: 10, mid: 13, high: 17 } },
    },
  },
  lahti: {
    city: "Lahti",
    pricePerSqm: { low: 1000, mid: 1700, high: 2800 },
    rentPerSqm: { low: 11, mid: 14, high: 19 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
    areas: {
      keskusta: { pricePerSqm: { low: 1500, mid: 2200, high: 3200 }, rentPerSqm: { low: 13, mid: 17, high: 22 } },
    },
  },
  pori: {
    city: "Pori",
    pricePerSqm: { low: 700, mid: 1200, high: 2200 },
    rentPerSqm: { low: 9, mid: 12, high: 16 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
  },
  joensuu: {
    city: "Joensuu",
    pricePerSqm: { low: 1000, mid: 1700, high: 2800 },
    rentPerSqm: { low: 11, mid: 14, high: 19 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
  },
  lappeenranta: {
    city: "Lappeenranta",
    pricePerSqm: { low: 900, mid: 1500, high: 2500 },
    rentPerSqm: { low: 10, mid: 13, high: 18 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
  },
  rovaniemi: {
    city: "Rovaniemi",
    pricePerSqm: { low: 1000, mid: 1800, high: 2800 },
    rentPerSqm: { low: 11, mid: 15, high: 20 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
  },
  hämeenlinna: {
    city: "Hämeenlinna",
    pricePerSqm: { low: 1000, mid: 1700, high: 2800 },
    rentPerSqm: { low: 10, mid: 14, high: 18 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
  },
  kouvola: {
    city: "Kouvola",
    pricePerSqm: { low: 600, mid: 1100, high: 1800 },
    rentPerSqm: { low: 8, mid: 11, high: 15 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
  },
  vaasa: {
    city: "Vaasa",
    pricePerSqm: { low: 1200, mid: 1900, high: 3000 },
    rentPerSqm: { low: 11, mid: 15, high: 20 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
  },
  seinäjoki: {
    city: "Seinäjoki",
    pricePerSqm: { low: 1100, mid: 1800, high: 2800 },
    rentPerSqm: { low: 10, mid: 14, high: 18 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
  },
  kotka: {
    city: "Kotka",
    pricePerSqm: { low: 500, mid: 900, high: 1600 },
    rentPerSqm: { low: 7, mid: 10, high: 14 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
  },
  mikkeli: {
    city: "Mikkeli",
    pricePerSqm: { low: 700, mid: 1300, high: 2200 },
    rentPerSqm: { low: 9, mid: 12, high: 16 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
  },
  rauma: {
    city: "Rauma",
    pricePerSqm: { low: 800, mid: 1300, high: 2200 },
    rentPerSqm: { low: 8, mid: 12, high: 16 },
    maintenancePerSqm: { low: 3.0, mid: 4.5, high: 6.0 },
  },
};

export interface MarketComparison {
  suggestedPrice: { low: number; mid: number; high: number };
  suggestedRent: { low: number; mid: number; high: number };
  suggestedMaintenance: { low: number; mid: number; high: number };
  priceRating: "below" | "on-par" | "above" | "unknown";
  rentRating: "below" | "on-par" | "above" | "unknown";
  maintenanceRating: "below" | "on-par" | "above" | "unknown";
  pricePerSqmUsed: { low: number; mid: number; high: number };
  rentPerSqmUsed: { low: number; mid: number; high: number };
  maintenancePerSqmUsed: { low: number; mid: number; high: number };
  source: "area" | "city" | "none";
  buildYearNote?: string;
}

function normalizeKey(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-zäöå]/g, "");
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function rateValue(value: number, range: { low: number; mid: number; high: number }): "below" | "on-par" | "above" {
  const lowThreshold = range.low * 0.9;
  const highThreshold = range.high * 1.1;
  if (value < lowThreshold) return "below";
  if (value > highThreshold) return "above";
  return "on-par";
}

function getMaintenanceAgeMultiplier(buildYear: number | null | undefined): { multiplier: number; note: string } {
  if (!buildYear) return { multiplier: 1.0, note: "" };
  const age = new Date().getFullYear() - buildYear;
  if (age <= 5) return { multiplier: 0.7, note: "New building: lower maintenance expected" };
  if (age <= 15) return { multiplier: 0.85, note: "Modern building: slightly below average maintenance" };
  if (age <= 30) return { multiplier: 1.0, note: "" };
  if (age <= 50) return { multiplier: 1.2, note: "Older building: higher maintenance expected" };
  return { multiplier: 1.45, note: "Old building: significantly higher maintenance expected" };
}

export function suggestCity(input: string): string | null {
  if (!input) return null;
  const key = normalizeKey(input);
  if (finnishMarketData[key]) return null;
  let bestMatch: string | null = null;
  let bestDist = Infinity;
  for (const cityKey of Object.keys(finnishMarketData)) {
    const dist = levenshtein(key, cityKey);
    const maxLen = Math.max(key.length, cityKey.length);
    if (dist < bestDist && dist <= Math.max(2, Math.floor(maxLen * 0.3))) {
      bestDist = dist;
      bestMatch = finnishMarketData[cityKey].city;
    }
  }
  return bestMatch;
}

export function suggestArea(city: string, input: string): string | null {
  if (!input || !city) return null;
  const cityKey = normalizeKey(city);
  const cityData = finnishMarketData[cityKey];
  if (!cityData?.areas) return null;
  const key = normalizeKey(input);
  if (cityData.areas[key]) return null;
  let bestMatch: string | null = null;
  let bestDist = Infinity;
  for (const areaKey of Object.keys(cityData.areas)) {
    const dist = levenshtein(key, areaKey);
    const maxLen = Math.max(key.length, areaKey.length);
    if (dist < bestDist && dist <= Math.max(2, Math.floor(maxLen * 0.35))) {
      bestDist = dist;
      bestMatch = areaKey.charAt(0).toUpperCase() + areaKey.slice(1);
    }
  }
  return bestMatch;
}

export function getMarketComparison(
  city: string,
  area: string,
  sizeM2: number,
  purchasePrice: number,
  rentPerMonth: number,
  maintenanceFeePerMonth: number,
  buildYear?: number | null
): MarketComparison | null {
  if (!city || sizeM2 <= 0) return null;

  const cityKey = normalizeKey(city);
  const cityData = finnishMarketData[cityKey];
  if (!cityData) return null;

  const areaKey = normalizeKey(area);
  const areaData = cityData.areas?.[areaKey];

  let pricePerSqm = cityData.pricePerSqm;
  let rentPerSqm = cityData.rentPerSqm;
  let maintenancePerSqm = cityData.maintenancePerSqm;
  let source: "area" | "city" = "city";

  if (areaData) {
    pricePerSqm = areaData.pricePerSqm;
    if (areaData.rentPerSqm) rentPerSqm = areaData.rentPerSqm;
    source = "area";
  }

  const { multiplier: maintMultiplier, note: buildYearNote } = getMaintenanceAgeMultiplier(buildYear);

  const adjustedMaintenance = {
    low: maintenancePerSqm.low * maintMultiplier,
    mid: maintenancePerSqm.mid * maintMultiplier,
    high: maintenancePerSqm.high * maintMultiplier,
  };

  const suggestedPrice = {
    low: Math.round(pricePerSqm.low * sizeM2),
    mid: Math.round(pricePerSqm.mid * sizeM2),
    high: Math.round(pricePerSqm.high * sizeM2),
  };
  const suggestedRent = {
    low: Math.round(rentPerSqm.low * sizeM2),
    mid: Math.round(rentPerSqm.mid * sizeM2),
    high: Math.round(rentPerSqm.high * sizeM2),
  };
  const suggestedMaintenance = {
    low: Math.round(adjustedMaintenance.low * sizeM2 * 10) / 10,
    mid: Math.round(adjustedMaintenance.mid * sizeM2 * 10) / 10,
    high: Math.round(adjustedMaintenance.high * sizeM2 * 10) / 10,
  };

  const userPricePerSqm = purchasePrice / sizeM2;
  const userRentPerSqm = rentPerMonth / sizeM2;
  const userMaintenancePerSqm = maintenanceFeePerMonth / sizeM2;

  return {
    suggestedPrice,
    suggestedRent,
    suggestedMaintenance,
    priceRating: purchasePrice > 0 ? rateValue(userPricePerSqm, pricePerSqm) : "unknown",
    rentRating: rentPerMonth > 0 ? rateValue(userRentPerSqm, rentPerSqm) : "unknown",
    maintenanceRating: maintenanceFeePerMonth > 0 ? rateValue(userMaintenancePerSqm, adjustedMaintenance) : "unknown",
    pricePerSqmUsed: pricePerSqm,
    rentPerSqmUsed: rentPerSqm,
    maintenancePerSqmUsed: adjustedMaintenance,
    source,
    buildYearNote: buildYearNote || undefined,
  };
}

export function getAvailableCities(): string[] {
  return Object.values(finnishMarketData).map((d) => d.city).sort();
}

export function getAvailableAreas(city: string): string[] {
  const cityKey = normalizeKey(city);
  const cityData = finnishMarketData[cityKey];
  if (!cityData?.areas) return [];
  return Object.keys(cityData.areas).map((k) => k.charAt(0).toUpperCase() + k.slice(1)).sort();
}
