interface WorkboxType {
  register(): void;
  addEventListener(event: string, callback: () => void): void;
  messageSkipWaiting(): void;
}

declare global {
  interface Window {
    workbox?: WorkboxType;
  }
}

export {};