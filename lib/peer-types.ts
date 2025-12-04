export interface FileInfo {
  id: string;
  name: string;
  size: number;
  file?: File;
}

export type ProtocolMessage =
  | { type: 'hello'; peerId: string }
  | { type: 'offer'; file: FileInfo }
  | { type: 'unoffer'; fileId: string }
  | { type: 'accept'; fileIds: string[] }
  | { type: 'fileContent'; fileId: string; name: string; data: ArrayBuffer };

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface PeerState {
  peerId: string | null;
  remotePeerId: string | null;
  status: ConnectionStatus;
  offeredFiles: FileInfo[];
  remoteFiles: FileInfo[];
}