/**
 * LootBar FC26 Safe Coins tiers — source: https://lootbar.gg/game-coins/fc26
 * Sale USD converted to GBP pence at ~0.79 FX (same as seed).
 * Bonus coins match LootBar free-gift amounts (+8K per 100K base).
 */
export const LOOTBAR_TIERS = [
  { label: '100K', coins: 100_000, bonus: 8_000, usdSale: 0.89, usdList: 0.96 },
  { label: '200K', coins: 200_000, bonus: 16_000, usdSale: 1.77, usdList: 1.92 },
  { label: '300K', coins: 300_000, bonus: 24_000, usdSale: 2.65, usdList: 2.88 },
  { label: '400K', coins: 400_000, bonus: 32_000, usdSale: 3.54, usdList: 3.84 },
  { label: '500K', coins: 500_000, bonus: 40_000, usdSale: 4.42, usdList: 4.8 },
  { label: '800K', coins: 800_000, bonus: 64_000, usdSale: 7.07, usdList: 7.68 },
  { label: '1M', coins: 1_000_000, bonus: 80_000, usdSale: 8.84, usdList: 9.6 },
  { label: '1.5M', coins: 1_500_000, bonus: 120_000, usdSale: 13.25, usdList: 14.4 },
  { label: '2M', coins: 2_000_000, bonus: 160_000, usdSale: 17.67, usdList: 19.2 },
  { label: '3M', coins: 3_000_000, bonus: 240_000, usdSale: 26.5, usdList: 28.8 },
  { label: '4M', coins: 4_000_000, bonus: 320_000, usdSale: 35.33, usdList: 38.4 },
  { label: '5M', coins: 5_000_000, bonus: 400_000, usdSale: 44.16, usdList: 48 },
  { label: '6M', coins: 6_000_000, bonus: 480_000, usdSale: 53, usdList: 57.6 },
  { label: '7M', coins: 7_000_000, bonus: 560_000, usdSale: 61.83, usdList: 67.2 },
  { label: '8M', coins: 8_000_000, bonus: 640_000, usdSale: 70.66, usdList: 76.8 },
  { label: '10M', coins: 10_000_000, bonus: 800_000, usdSale: 88.32, usdList: 96 },
  { label: '15M', coins: 15_000_000, bonus: 1_200_000, usdSale: 134, usdList: 144 },
  { label: '20M', coins: 20_000_000, bonus: 1_600_000, usdSale: 182, usdList: 192 },
  { label: '30M', coins: 30_000_000, bonus: 2_400_000, usdSale: 278, usdList: 288 },
] as const;

const USD_TO_GBP = 0.79;

export function usdToGbpPence(usd: number) {
  return Math.round(usd * USD_TO_GBP * 100);
}

export function discountPct(salePence: number, listPence: number) {
  if (!listPence || listPence <= salePence) return 0;
  return Math.round(((listPence - salePence) / listPence) * 100);
}
