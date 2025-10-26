import type { EventMap } from "../util/events";

export type ApplicationRecordStatus = "idle" | "recording" | "waiting";
export type ApplicationAudioStatus = "loading" | "loaded" | "clear";
export type ApplicationTransportStatus = "paused" | "playing" | "stop";

export interface ApplicationEvents extends EventMap {
  transport: ApplicationTransportStatus;
  record: ApplicationRecordStatus;
  audio: {
    status: ApplicationAudioStatus;
    id?: string;
  };
  status: {
    type: "loading" | "ready";
    message: string;
  };
}
