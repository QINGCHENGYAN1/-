import { app, BrowserWindow } from 'electron';
import path from 'path';

// Define missing globals for TypeScript
declare const require: (module: string) => any;
declare const __dirname: string;

// 处理 Windows 安装程序的创建/移除快捷方式
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: true, // 使用系统原生标题栏，如果想完全自定义如网易云，设为 false 并在前端实现拖拽
    autoHideMenuBar: true, // 隐藏菜单栏
    backgroundColor: '#18181b', // 匹配 React 应用背景色
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // 允许加载本地文件 (如 file:// 协议播放本地音乐)
    },
  });

  // 开发环境下加载 Vite 服务，生产环境下加载打包文件
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools(); // 开发模式下开启控制台
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if ((process as any).platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});