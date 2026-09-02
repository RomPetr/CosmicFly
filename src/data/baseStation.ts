export const shopSlotGroups = [
  { id: 'weapon', label: 'Weapons', count: 3 },
  { id: 'armor', label: 'Armor', count: 3 },
  { id: 'engine', label: 'Engine', count: 3 },
] as const;

export type ShopSlotGroupId = (typeof shopSlotGroups)[number]['id'];

export const baseStationLayout = {
  overlayColor: 0x0b0d12,
  overlayAlpha: 0.88,
  depth: 1800,
  titleColor: '#f4f7fb',
  accentColor: '#7fd4ff',
  mutedColor: '#9aa7b8',
  bodyColor: '#c5d0dc',
  slotStroke: 0x5fd4ff,
  slotFill: 0x101828,
  slotSizePx: 56,
  slotGapPx: 10,
  groupGapPx: 36,
  slotBottomMarginPx: 28,
} as const;
