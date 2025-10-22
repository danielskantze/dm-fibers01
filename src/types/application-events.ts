export type ApplicationRecordStatus = "idle" | "recording" | "waiting";
export type ApplicationTransportStatus = "paused" | "playing";

export type ApplicationEvents = {
  record: ApplicationRecordStatus,
  transport: ApplicationTransportStatus
}