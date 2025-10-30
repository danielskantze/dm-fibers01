type Logger = {
  id: string;
  n: number;
  counter: number;
};

export class StreamLogging {
  static _instance: StreamLogging | null = null;
  private _loggers: Record<string, Logger> = {};
  constructor() {}

  add(id: string, each: number) {
    if (this._loggers[id]) {
      throw new Error(`Logger with ${id} already added`);
    }
    this._loggers[id] = {
      id,
      n: each,
      counter: performance.now(),
    };
  }
  remove(id: string) {
    this._loggers[id];
  }
  _log(id: string, args: any[]) {
    console.log(id, ...args);
  }
  doLog(id: string, args: any[]) {
    const logger = this._loggers[id];
    if (logger) {
      logger.counter++;
      if (logger.counter >= logger.n) {
        logger.counter = 0;
        this._log(logger.id, args);
      }
    }
  }

  static log(id: string, args: any[]) {
    if (StreamLogging._instance === null) {
      StreamLogging._instance = new StreamLogging();
    }
    StreamLogging._instance.doLog(id, args);
  }
  static addOrlog(id: string, each: number, args: any[]) {
    if (StreamLogging._instance === null) {
      StreamLogging._instance = new StreamLogging();
    }
    if (!StreamLogging._instance._loggers[id]) {
      StreamLogging._instance.add(id, each);
      StreamLogging._instance._log(id, args);
    }
    StreamLogging._instance.doLog(id, args);
  }
}
