export type ApplicationRecordStatus = "idle" | "recording" | "waiting";
export type ApplicationAudioStatus = "loading" | "loaded";
export type ApplicationTransportStatus = "paused" | "playing";

export type ApplicationEvents = {
  record: ApplicationRecordStatus,
  transport: ApplicationTransportStatus,
  audio: ApplicationAudioStatus
}