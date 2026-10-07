export type DeviceType = "mobile" | "tablet" | "desktop";

export function getDeviceType(userAgent: string, maxTouchPoints = 0): DeviceType {
  if (/iPad|Tablet|Android(?!.*Mobi)/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) {
    return "tablet";
  }
  return /Mobi|iPhone|iPod/i.test(userAgent) ? "mobile" : "desktop";
}
