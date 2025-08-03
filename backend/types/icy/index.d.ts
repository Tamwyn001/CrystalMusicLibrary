// types/icy/index.d.ts
declare module 'icy' {
  import { IncomingMessage } from 'http';
  import { ClientRequest } from 'http';

  export function get(
    url: string | URL,
    cb: (res: IncomingMessage) => void
  ): ClientRequest;

  export function request(
    url: string | URL,
    cb: (res: IncomingMessage) => void
  ): ClientRequest;

  export function parse(metadata: Buffer): Record<string, string>;
}
