import { Monitor, Smartphone, Tablet } from "lucide-react";
import type { DeviceType } from "@/lib/device-type";
import { THEME } from "../constants";
import { cn } from "@/lib/utils";

const devices = {
  mobile: { icon: Smartphone, label: "Mobile" },
  tablet: { icon: Tablet, label: "Tablet" },
  desktop: { icon: Monitor, label: "Desktop / laptop" },
};

export function DeviceIcon({ deviceType }: { deviceType?: DeviceType }) {
  if (!deviceType) return null;
  const { icon: Icon, label } = devices[deviceType];
  return (
    <span role="img" aria-label={label} title={label} className={cn("inline-flex shrink-0 align-middle", THEME.text.secondary)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}
