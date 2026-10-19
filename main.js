const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { execFile } = require('child_process');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
app.setAppUserModelId('com.arcaw.app');

const SKIP = new Set(['.git', 'node_modules', 'dist', 'out', '.next', '__pycache__']);
const GIT_OK = new Set(['status', 'add', 'reset', 'restore', 'commit', 'rev-parse', 'branch', 'checkout', 'log', 'show', 'remote', 'fetch', 'pull', 'push', 'init', 'rm']);
// flags that could destroy work, write arbitrary files or run external programs are never forwarded
const GIT_BAD = /^(--hard|--force(-with-lease)?|-f|-c|--config.*|--output.*|--exec.*|--upload-pack.*|--receive-pack.*|--git-dir.*|--work-tree.*)$/;
const exists_ = async f => { try { await fs.access(f); return true; } catch { return false; } };
const stateFile = () => path.join(app.getPath('userData'), 'state.json');
let win, force = false;

const BLOCKED_KEYS = new Set(['F12', 'F5']);
function create() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1400, height: 880, minWidth: 900, minHeight: 560,
    frame: false, show: false, backgroundColor: '#21252b', title: 'Arcaw', icon: path.join(__dirname, 'renderer', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, devTools: false, spellcheck: false }
  });
  const wc = win.webContents;
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });

  /* ---- behave like a packaged desktop app: no DevTools, no browser shortcuts, no navigation ---- */
  wc.on('devtools-opened', () => wc.closeDevTools());
  wc.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    const k = i.key, ctrl = i.control || i.meta;
    const devtools = k === 'F12' || (ctrl && i.shift && /^[ijc]$/i.test(k));
    const reload = BLOCKED_KEYS.has(k) || (ctrl && /^r$/i.test(k));
    if (devtools || reload) e.preventDefault();
  });
  wc.setVisualZoomLevelLimits(1, 1);
  wc.on('will-navigate', e => e.preventDefault());
  wc.on('context-menu', (_e, p) => {
    if (!p.isEditable && !p.selectionText) return;
    Menu.buildFromTemplate(p.isEditable
      ? [{ role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { type: 'separator' }, { role: 'selectAll' }]
      : [{ role: 'copy' }, { role: 'selectAll' }]).popup({ window: win });
  });
  wc.on('console-message', (...a) => { const d = a[0]; console.log('[renderer]', d && d.message !== undefined ? d.message : a[2]); });
  wc.on('did-fail-load', (_e, c, d, u) => console.log('[load failed]', c, d, u));
  win.on('maximize', () => wc.send('win:state', true));
  win.on('unmaximize', () => wc.send('win:state', false));
  win.on('close', e => { if (!force) { e.preventDefault(); wc.send('app:close'); } });
  wc.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
}
if (gotLock) app.whenReady().then(() => { create(); initUpdater(); });
app.on('window-all-closed', () => app.quit());
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

/* ---------- Remote updates (electron-updater; works for the installed NSIS build) ---------- */
let updater = null, upd = { state: 'idle' };
const sendUpd = s => { upd = s; if (win && !win.isDestroyed()) win.webContents.send('update:status', s); };
const checkUpdates = () => { if (updater && upd.state !== 'downloading' && upd.state !== 'ready') updater.checkForUpdates().catch(() => { /* reported through the 'error' event */ }); };
function initUpdater() {
  if (!app.isPackaged || process.env.PORTABLE_EXECUTABLE_DIR) return;   // dev run, or portable exe (cannot replace itself)
  try { updater = require('electron-updater').autoUpdater; } catch (e) { console.log('[updater] unavailable:', e.message); return; }
  updater.autoDownload = true; updater.autoInstallOnAppQuit = true; updater.logger = null;
  updater.on('checking-for-update', () => sendUpd({ state: 'checking' }));
  updater.on('update-available', i => sendUpd({ state: 'downloading', version: i.version, percent: 0 }));
  updater.on('update-not-available', () => sendUpd({ state: 'none' }));
  updater.on('download-progress', p => sendUpd({ state: 'downloading', version: upd.version, percent: Math.round(p.percent) }));
  updater.on('update-downloaded', i => sendUpd({ state: 'ready', version: i.version }));
  updater.on('error', e => sendUpd({ state: 'error', message: String((e && e.message) || e).split('\n')[0].slice(0, 200) }));
  setTimeout(checkUpdates, 8000); setInterval(checkUpdates, 4 * 3600 * 1000);
}
const h = (c, f) => ipcMain.handle(c, (_e, ...a) => f(...a));
h('win:min', () => win.minimize());
h('win:max', () => (win.isMaximized() ? win.unmaximize() : win.maximize()));
h('win:close', () => win.close());
h('win:fullscreen', () => win.setFullScreen(!win.isFullScreen()));
h('win:force', () => { force = true; win.close(); });
h('update:state', () => upd);
h('update:check', () => { if (!updater) return { state: 'unsupported' }; checkUpdates(); return upd; });
h('update:install', () => { if (updater && upd.state === 'ready') { force = true; updater.quitAndInstall(true, true); } });

h('state:get', async () => { try { return JSON.parse(await fs.readFile(stateFile(), 'utf8')); } catch { return {}; } });
h('state:set', s => fs.writeFile(stateFile(), JSON.stringify(s)));

h('dlg:folder', async () => { const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] }); return r.canceled ? null : r.filePaths[0]; });
h('dlg:files', async () => { const r = await dialog.showOpenDialog(win, { properties: ['openFile', 'multiSelections'] }); return r.canceled ? [] : r.filePaths; });
h('dlg:confirm', async (msg, buttons) => (await dialog.showMessageBox(win, { type: 'question', message: msg, buttons, defaultId: 0, cancelId: buttons.length - 1, noLink: true })).response);

h('fs:readdir', async d => (await fs.readdir(d, { withFileTypes: true }))
  .filter(x => x.name !== '.git')
  .map(x => ({ name: x.name, path: path.join(d, x.name), dir: x.isDirectory() }))
  .sort((a, b) => b.dir - a.dir || a.name.localeCompare(b.name)));
h('fs:read', async f => {
  const s = await fs.stat(f);
  if (s.size > 8e6) throw new Error('File too large (>8 MB)');
  const b = await fs.readFile(f);
  if (b.includes(0)) throw new Error('Binary files cannot be opened');
  return b.toString('utf8');
});
h('fs:write', (f, t) => fs.writeFile(f, t, 'utf8'));
h('fs:create', async (p, isDir) => {
  if (isDir) return fs.mkdir(p, { recursive: true });
  await fs.mkdir(path.dirname(p), { recursive: true });
  return fs.writeFile(p, '', { flag: 'wx' });
});
h('fs:rename', (a, b) => fs.rename(a, b));
// ---- copy / move / paste support ----
const inside = (child, parent) => { const c = path.resolve(child), p = path.resolve(parent); return c === p || (c + path.sep).startsWith(p + path.sep); };
h('fs:exists', exists_);
h('fs:unique', async (dir, name) => {
  const ext = path.extname(name), stem = name.slice(0, name.length - ext.length);
  for (let i = 1; ; i++) { const cand = path.join(dir, i === 1 ? `${stem} copy${ext}` : `${stem} copy ${i}${ext}`); if (!(await exists_(cand))) return cand; }
});
h('fs:copy', async (src, dest) => {
  if (inside(dest, src)) throw new Error('Cannot copy a folder into itself');
  await fs.cp(src, dest, { recursive: true, errorOnExist: true, force: false });
});
h('fs:move', async (src, dest, replace) => {
  if (inside(dest, src)) throw new Error('Cannot move a folder into itself');
  if (replace && (await exists_(dest))) await shell.trashItem(path.resolve(dest));
  try { await fs.rename(src, dest); }
  catch (e) { if (e.code !== 'EXDEV') throw e; await fs.cp(src, dest, { recursive: true, errorOnExist: true, force: false }); await fs.rm(src, { recursive: true, force: true }); }
});

h('fs:delete', p => shell.trashItem(p));
h('fs:reveal', p => shell.showItemInFolder(p));

async function walk(root, fn, limit = 20000) {
  let n = 0; const st = [root];
  while (st.length && n < limit) {
    const d = st.pop(); let l;
    try { l = await fs.readdir(d, { withFileTypes: true }); } catch { continue; }
    for (const x of l) {
      const p = path.join(d, x.name);
      if (x.isDirectory()) { if (!SKIP.has(x.name)) st.push(p); }
      else { n++; if ((await fn(p)) === false) return; }
    }
  }
}
h('fs:list', async root => { const out = []; await walk(root, p => { out.push(p); }); return out; });
h('fs:search', async (root, q, cs) => {
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), cs ? '' : 'i');
  const out = [];
  await walk(root, async p => {
    try {
      if ((await fs.stat(p)).size > 1e6) return;
      const t = await fs.readFile(p, 'utf8');
      if (t.includes('\0')) return;
      const L = t.split('\n');
      for (let i = 0; i < L.length; i++) {
        if (re.test(L[i])) { out.push({ file: p, line: i + 1, text: L[i].trim().slice(0, 200) }); if (out.length >= 500) return false; }
      }
    } catch { /* unreadable */ }
  });
  return out;
});

h('git', (cwd, args) => new Promise(res => {
  if (!Array.isArray(args) || !GIT_OK.has(args[0])) return res({ ok: false, out: '', err: 'Command not allowed' });
  if (args.some(a => typeof a !== 'string' || GIT_BAD.test(a))) return res({ ok: false, out: '', err: 'Option not allowed' });
  if (args[0] === 'rm' && !args.includes('--cached')) return res({ ok: false, out: '', err: 'Option not allowed' }); // never delete working files
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_EDITOR: 'true', GIT_MERGE_AUTOEDIT: 'no', LC_ALL: 'C', LANGUAGE: 'en' };
  execFile('git', args, { cwd, maxBuffer: 5e7, windowsHide: true, timeout: 120000, env }, (e, o, er) => res({ ok: !e, out: o || '', err: (er || '').trim() || (o || '').trim() || (e && e.message) || '', code: e ? e.code : 0 }));
}));

/* ---------- Real pseudo-terminals (same approach as VS Code: node-pty) ---------- */
const ptys = new Map();
const exists = async f => { try { await fs.access(f); return true; } catch { return false; } };
h('pty:shells', async () => {
  if (process.platform === 'win32') {
    const l = [['powershell.exe', 'Windows PowerShell'], ['cmd.exe', 'Command Prompt']];
    for (const [f, n] of [['C:\\Program Files\\PowerShell\\7\\pwsh.exe', 'PowerShell 7'], ['C:\\Program Files\\Git\\bin\\bash.exe', 'Git Bash']]) if (await exists(f)) l.push([f, n]);
    return l;
  }
  const l = [];
  for (const [f, n] of [[process.env.SHELL, 'Default Shell'], ['/bin/bash', 'bash'], ['/bin/zsh', 'zsh'], ['/bin/sh', 'sh']]) if (f && (await exists(f)) && !l.some(x => x[0] === f)) l.push([f, n]);
  return l;
});
h('pty:create', async (id, o) => {
  let pty;
  try { pty = require('@lydell/node-pty'); }
  catch (e) { return { error: 'Terminal backend could not be loaded: ' + e.message + '\n\nRun "npm install" in the project folder and restart the app.' }; }
  const old = ptys.get(id); if (old) { ptys.delete(id); try { old.p.kill(); } catch { /* gone */ } }
  let cwd = o.cwd; try { if (!(await fs.stat(cwd)).isDirectory()) throw new Error(); } catch { cwd = app.getPath('home'); }
  const file = o.file || (process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash');
  const args = /bash\.exe$/i.test(file) ? ['--login', '-i'] : [];
  const env = { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor', TERM_PROGRAM: 'Arcaw' };
  let p;
  try { p = pty.spawn(file, args, { name: 'xterm-256color', cols: o.cols || 80, rows: o.rows || 24, cwd, env }); }
  catch (e) { return { error: 'Failed to start "' + file + '": ' + e.message }; }
  const rec = { p, buf: '', timer: null };
  const flush = () => { rec.timer = null; if (rec.buf && win && !win.isDestroyed()) win.webContents.send('pty:data', id, rec.buf); rec.buf = ''; };
  p.onData(d => { rec.buf += d; if (rec.buf.length > 65536) { clearTimeout(rec.timer); flush(); } else if (!rec.timer) rec.timer = setTimeout(flush, 4); });
  p.onExit(({ exitCode }) => {
    clearTimeout(rec.timer); flush();
    if (ptys.get(id) === rec) { ptys.delete(id); if (win && !win.isDestroyed()) win.webContents.send('pty:exit', id, exitCode); }
  });
  ptys.set(id, rec);
  return { pid: p.pid };
});
ipcMain.on('pty:write', (_e, id, d) => { const r = ptys.get(id); if (r) r.p.write(d); });
ipcMain.on('pty:resize', (_e, id, c, rw) => { const r = ptys.get(id); if (r && c > 0 && rw > 0) { try { r.p.resize(c, rw); } catch { /* exited */ } } });
h('pty:kill', id => { const r = ptys.get(id); if (r) { ptys.delete(id); try { r.p.kill(); } catch { /* gone */ } } });
app.on('before-quit', () => { for (const r of ptys.values()) { try { r.p.kill(); } catch { /* gone */ } } });

h('app:config', () => shell.openPath(app.getPath('userData')));
h('app:info', () => ({ userData: app.getPath('userData'), version: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome, node: process.versions.node, platform: process.platform + ' ' + (process.getSystemVersion ? process.getSystemVersion() : ''), win: process.platform === 'win32', winBuild: process.platform === 'win32' ? parseInt(String(process.getSystemVersion()).split('.')[2], 10) || 0 : 0, home: app.getPath('home') }));
