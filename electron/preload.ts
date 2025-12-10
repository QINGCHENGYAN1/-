import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程 (React)
contextBridge.exposeInMainWorld('electronAPI', {
  // 示例：这里可以添加读取本地文件、打开系统对话框等原生能力
  platform: (process as any).platform
});