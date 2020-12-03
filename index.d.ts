import { EventEmitter } from "events";
import { Reader } from "maxmind";

declare module "geolite2-redist" {
  export const databases: string[]
  export const open:
    <T>(database: string, readerBuilder: (database: string) =>
      (Reader<T> | Promise<Reader<T>>)) => Promise<Reader<T>>
  export class UpdateSubscriber extends EventEmitter {
    public downloading: boolean;
    private _checker: ReturnType<typeof setTimeout>;

    downloadDbs(path?: string): Promise<void>;
    checkUpdates(): Promise<void>;
    update(): void;
    triggerUpdate(): Promise<void>;
    close(): void;
    private _wait(time: number): Promise<void>;
  }
}
