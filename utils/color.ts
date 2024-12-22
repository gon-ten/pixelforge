export type RgbaColorString =
  `rgba(${number}, ${number}, ${number}, ${number})`;

export type RgbaColor = [r: number, g: number, b: number, a: number];

export type HexColorString = `#${string}`;

export type ColorValue = RgbaColor | HexColorString | RgbaColorString;

export function anyColorFormatToColor(value: ColorValue): RgbaColor {
  if (typeof value === 'string') {
    return colorStringToRgbaColor(value);
  }
  return value;
}

function isShortHex(hex: string): boolean {
  return hex.length === 4;
}

function isHexColorString(hex: string): hex is HexColorString {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/i.test(hex);
}

function expandShortHex(hex: string): string {
  return '#' + hex.slice(1)
    .split('')
    .map((char) => char + char)
    .join('');
}

export function hexToRgba(
  hex: string,
): [r: number, g: number, b: number, a: number] {
  if (!isHexColorString(hex)) {
    throw new Error('Invalid hex color');
  }
  if (isShortHex(hex)) {
    hex = expandShortHex(hex);
  }
  const hexValue = hex.replace('#', '');
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);
  let a = parseInt(hexValue.substring(6, 8), 16);
  if (Number.isNaN(a)) {
    a = 255;
  }
  return [r, g, b, a / 255];
}

const RGBA_COLOR_REGEX =
  /^rgba\((?<red>(?:[1-9]?\d|1\d{2}|2[0-4]\d|25[0-5])), (?<green>(?:[1-9]?\d|1\d{2}|2[0-4]\d|25[0-5])), (?<blue>(?:[1-9]?\d|1\d{2}|2[0-4]\d|25[0-5])), (?<alpha>(0?[.]\d+)|1)\)$/i;

export function rgbaColorStringToRgbaColor(
  rgbaStr: RgbaColorString,
): RgbaColor {
  const match = rgbaStr.match(RGBA_COLOR_REGEX);

  if (!match) {
    throw new Error('Invalid rgba color');
  }

  const { red, green, blue, alpha } = match.groups!;

  return [red, green, blue, alpha].map((str) =>
    parseFloat(str.trim())
  ) as RgbaColor;
}

export function colorStringToRgbaColor(
  color: HexColorString | RgbaColorString,
): RgbaColor {
  if (isHexColorString(color)) {
    return hexToRgba(color);
  }
  return rgbaColorStringToRgbaColor(color);
}
