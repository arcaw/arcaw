const { contextBridge, ipcRenderer: r, webUtils } = require('electron');
const api = {};
['win:min', 'win:max', 'win:close', 'win:force', 'win:fullscreen', 'update:state', 'update:check', 'update:install', 'state:get', 'state:set',
  'dlg:folder', 'dlg:files', 'dlg:confirm', 'fs:readdir', 'fs:read', 'fs:write', 'fs:create',
  'fs:rename', 'fs:exists', 'fs:unique', 'fs:copy', 'fs:move', 'fs:delete', 'fs:reveal', 'fs:list', 'fs:search', 'git',
  'pty:create', 'pty:kill', 'pty:shells', 'app:config', 'app:info', 'app:pending']
  .forEach(n => { api[n.replace(':', '_')] = (...a) => r.invoke(n, ...a); });
// high-frequency channels are fire-and-forget for lowest latency
api.pty_write = (id, d) => r.send('pty:write', id, d);
api.pty_resize = (id, c, rw) => r.send('pty:resize', id, c, rw);
// absolute path of a File dropped onto the window
api.pathFor = f => { try { return webUtils.getPathForFile(f); } catch { return ''; } };
api.on = (ch, cb) => r.on(ch, (_e, ...a) => cb(...a));
contextBridge.exposeInMainWorld('api', api);
