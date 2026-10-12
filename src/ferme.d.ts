// Le pont de l'application de bureau (voir electron/preload.cjs) ; absent dans un navigateur.
interface UpdateInfo {
  state: "checking" | "none" | "downloading" | "ready" | "error" | "dev";
  version?: string;
  percent?: number;
  message?: string;
}
interface FermeBridge {
  isDesktop: boolean;
  version: string;
  readSave(key: string): string | null;
  writeSave(key: string, json: string): void;
  onUpdate(cb: (u: UpdateInfo) => void): void;
  checkUpdate(): void;
  installUpdate(): void;
}
interface Window {
  ferme?: FermeBridge;
}
