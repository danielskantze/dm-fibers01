import type { Dispatcher } from "../util/events";

export type ApplicationEvents = "record" | "transport";

export type ApplicationRecordEvents = "idle" | "recording" | "waiting";
export type ApplicationTransportEvents = "paused" | "playing";

export type ApplicationDispatcher = Dispatcher<ApplicationEvents>;