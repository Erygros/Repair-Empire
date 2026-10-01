import { memo } from "react";
import { DEVICE_VISUALS } from "@/game/data/workshop-visuals";
import type { DeviceKind } from "@/game/types";

function DeviceVisualComponent({ device, phase }: { device: DeviceKind; phase: string }) {
  const visual = DEVICE_VISUALS[device];
  return <div className={`device-visual device-${visual.token} phase-${phase.toLowerCase()}`} aria-label={`${device}, ${phase}`}>
    <span className="device-shell"><i className="device-screen" /><i className="device-port" /><i className="device-detail" /></span>
    <span className="device-scan" aria-hidden="true" />
  </div>;
}

export const DeviceVisual = memo(DeviceVisualComponent);
