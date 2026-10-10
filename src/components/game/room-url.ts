export function readRoomCode(href: string): string | null {
  const params = new URL(href).searchParams;
  return (params.get("room") ?? params.get("game"))?.trim().toLowerCase() ?? null;
}

export function roomUrl(href: string, room: string | null): URL {
  const url = new URL(href);
  url.searchParams.delete("game");
  url.searchParams.delete("room");
  if (room !== null) url.searchParams.set("room", room);
  return url;
}
