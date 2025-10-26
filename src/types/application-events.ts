export type ApplicationRecordStatus = "idle" | "recording" | "waiting";
export type ApplicationAudioStatus = "loading" | "loaded" | "clear";
export type ApplicationTransportStatus = "paused" | "playing" | "stop";

export type ApplicationEvents = {
  record: ApplicationRecordStatus;
  transport: ApplicationTransportStatus;
  audio: {
    status: ApplicationAudioStatus;
    id?: string;
  };
};
