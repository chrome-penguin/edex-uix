const { contextBridge, ipcRenderer, webFrame } = require('electron');
const { app, screen, globalShortcut, getCurrentWindow, shell, clipboard } = require('@electron/remote');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { nanoid } = require('nanoid/non-secure');
const username = require('username');
const { Terminal } = require('@xterm/xterm');
const { AttachAddon } = require('@xterm/addon-attach');
const { FitAddon } = require('@xterm/addon-fit');
const { LigaturesAddon } = require('@xterm/addon-ligatures');
const { WebglAddon } = require('@xterm/addon-webgl');
const color = require('color');
const mime = require('mime-types');
const smoothie = require('smoothie');
const prettyBytes = require('pretty-bytes');

contextBridge.exposeInMainWorld('eDEX', {
  ipc: {
    send: (...args) => ipcRenderer.send(...args),
    on: (...args) => ipcRenderer.on(...args),
    once: (...args) => ipcRenderer.once(...args),
    invoke: (...args) => ipcRenderer.invoke(...args),
  },
  remote: {
    app: {
      getPath: (name) => app.getPath(name),
      getVersion: () => app.getVersion(),
      focus: () => app.focus(),
      relaunch: () => app.relaunch(),
      quit: () => app.quit(),
    },
    process: {
      argv: process.argv,
      versions: process.versions,
      platform: process.platform,
    },
    screen: {
        getPrimaryDisplay: () => screen.getPrimaryDisplay(),
        getAllDisplays: () => screen.getAllDisplays(),
    },
    clipboard: {
        readText: () => clipboard.readText(),
    },
    globalShortcut: {
      register: (accelerator, callback) => globalShortcut.register(accelerator, callback),
      unregisterAll: () => globalShortcut.unregisterAll(),
    },
    getCurrentWindow: () => {
      const win = getCurrentWindow();
      // Expose a limited set of methods from the window object
      return {
        webContents: {
          toggleDevTools: () => win.webContents.toggleDevTools(),
        },
        isFullScreen: () => win.isFullScreen(),
        setFullScreen: (flag) => win.setFullScreen(flag),
        minimize: () => win.minimize(),
        on: (event, callback) => win.on(event, callback),
        getSize: () => win.getSize(),
        setSize: (width, height) => win.setSize(width, height),
        isMaximized: () => win.isMaximized(),
        unmaximize: () => win.unmaximize(),
      };
    },
  },
  shell: {
    openPath: (path) => shell.openPath(path),
    openExternal: (url) => shell.openExternal(url),
  },
  webFrame: {
    setVisualZoomLevelLimits: (min, max) => webFrame.setVisualZoomLevelLimits(min, max),
  },
  fs: {
    readFileSync: (path, options) => fs.readFileSync(path, options),
    writeFileSync: (path, data, options) => fs.writeFileSync(path, data, options),
    readdirSync: (path) => fs.readdirSync(path),
    existsSync: (path) => fs.existsSync(path),
    writeFile: (path, data, options, callback) => fs.writeFile(path, data, options, callback),
    watch: (path, options, callback) => fs.watch(path, options, callback),
    lstat: (path, callback) => fs.lstat(path, callback),
    readFile: (path, options, callback) => fs.readFile(path, options, callback),
  },
  path: {
    join: (...paths) => path.join(...paths),
    resolve: (...paths) => path.resolve(...paths),
  },
  os: {
    platform: () => os.platform(),
    uptime: () => os.uptime(),
  },
  __dirname: __dirname,
  nanoid: () => nanoid(),
  username: () => username(),
  xterm: {
    Terminal,
    AttachAddon,
    FitAddon,
    LigaturesAddon,
    WebglAddon,
  },
  color: (c) => color(c),
  mime: {
    lookup: (filename) => mime.lookup(filename),
    charset: (type) => mime.charset(type),
  },
  smoothie: {
    TimeSeries: smoothie.TimeSeries,
    SmoothieChart: smoothie.SmoothieChart,
  },
  prettyBytes: (bytes) => prettyBytes(bytes),
  gridData: JSON.parse(fs.readFileSync(path.join(__dirname, 'assets/misc/grid.json'), 'utf8')),
  howler: {
    Howl,
    Howler,
  }
});