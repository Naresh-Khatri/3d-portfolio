export function resolveMessageFlag(
  message: { flag?: string | null; country?: string | null },
  profileFlag?: string | null,
): string {
  const flag = message.flag?.trim();
  if (flag && flag !== "??") return flag;

  const country = message.country?.trim().toUpperCase();
  if (country && /^[A-Z]{2}$/.test(country) && country !== "XX" && country !== "ZZ") {
    return String.fromCodePoint(...Array.from(country, (letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
  }

  const fallback = profileFlag?.trim();
  return fallback && fallback !== "??" ? fallback : "??";
}
