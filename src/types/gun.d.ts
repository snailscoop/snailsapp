declare module 'gun' {
  interface GunConstructorOptions {
    peers?: string[];
    localStorage?: boolean;
  }

  interface GunPeer {
    id: string;
    url: string;
  }

  interface GunUser {
    recall: (opts: { sessionStorage: boolean }) => any;
  }

  class Gun {
    constructor(options?: GunConstructorOptions);
    user(): GunUser;
    on(event: string, callback: (peer: GunPeer) => void): void;
    off(event: string): void;
    _: {
      opt: {
        peers: Record<string, GunPeer>;
      };
    };
  }

  export = Gun;
} 