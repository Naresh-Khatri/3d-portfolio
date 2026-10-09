import type { User } from "@/contexts/socketio";
import type { PlayerSnap } from "./protocol";

export type PlayerProfile = { name: string; color: string; avatar?: string };
export type PlayerProfiles = Map<string, PlayerProfile>;

export function collectPlayerProfiles(users: User[]): PlayerProfiles {
  return new Map(
    users.map((user) => [
      user.socketId,
      {
        name: user.name,
        color: user.color,
        avatar: user.avatar,
      },
    ]),
  );
}

export function resolvePlayerProfile(
  player: PlayerSnap,
  profiles: PlayerProfiles,
): PlayerProfile {
  const profile = profiles.get(player.id);
  return {
    name: profile?.name || player.name,
    color: profile?.color || player.color,
    avatar: profile?.avatar,
  };
}
