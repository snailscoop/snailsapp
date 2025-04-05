declare module 'gun' {
  interface GunDataNode {
    _: {
      '#': string;
      '>': {
        [key: string]: number;
      };
    };
    [key: string]: any;
  }

  interface GunNode {
    _: {
      [key: string]: any;
    };
    $: GunNode;
    get: (key: string) => GunNode;
    put: (data: any, cb?: (ack: any) => void) => GunNode;
    set: (data: any, cb?: (ack: any) => void) => GunNode;
    map: () => GunNode;
    on: (callback: (data: any, key: string) => void, options?: { change: boolean }) => void;
    once: (callback: (data: any, key: string) => void) => void;
    off: () => void;
  }

  interface GunConstructorOptions {
    peers?: string[];
    localStorage?: boolean;
    radisk?: boolean;
    file?: boolean;
    web?: boolean;
    axe?: boolean;
    multicast?: boolean;
    retry?: number;
    ws?: {
      maxPayload?: number;
    };
    [key: string]: any;
  }

  interface GunUser {
    create: (username: string, password: string, cb?: (ack: any) => void) => any;
    auth: (username: string, password: string, cb?: (ack: any) => void) => any;
    leave: () => void;
    delete: (username: string, password: string) => void;
    recall: (options?: { sessionStorage: boolean }) => any;
    is: any;
  }

  class Gun {
    constructor(options?: GunConstructorOptions);

    _: {
      opt: {
        peers: string[];
      };
      [key: string]: any;
    };

    get(key: string): GunNode;
    put(data: any, cb?: (ack: any) => void): GunNode;
    set(data: any, cb?: (ack: any) => void): GunNode;
    map(): GunNode;
    on(event: string, callback: (data: any, key?: string) => void): void;
    once(callback: (data: any, key?: string) => void): void;
    off(): void;
    user(): GunUser;
  }

  export = Gun;
}

declare module 'gun/sea.js' {}
declare module 'gun/axe.js' {} 