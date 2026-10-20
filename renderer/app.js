'use strict';
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sepOf = p => (p.includes('\\') ? '\\' : '/');
const base = p => p.split(/[\\/]/).pop();
const dirOf = p => p.slice(0, Math.max(p.lastIndexOf('\\'), p.lastIndexOf('/')));
const join = (d, n) => d + (/[\\/]$/.test(d) ? '' : sepOf(d)) + n;
const clean = e => String(e && e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- Themes (drive both UI colors and Monaco) ---------- */
const THEMES = {
  'one-dark': { n: 'One Dark', b: 'vs-dark', bg: '#282c34', side: '#21252b', border: '#181a1f', text: '#abb2bf', muted: '#5c6370', bright: '#dce1e9', accent: '#4d78cc', hover: '#2c313a', sel: '#3e4451', kw: '#c678dd', str: '#98c379', com: '#5c6370', fn: '#61afef', num: '#d19a66', type: '#e5c07b' },
  'atom-light': { n: 'Arcaw Light', b: 'vs', bg: '#fafafa', side: '#eaeaeb', border: '#d3d3d4', text: '#383a42', muted: '#8a8b90', bright: '#000000', accent: '#4078f2', hover: '#dfdfe0', sel: '#d0d0d4', kw: '#a626a4', str: '#50a14f', com: '#a0a1a7', fn: '#4078f2', num: '#986801', type: '#c18401' },
  dracula: { n: 'Dracula', b: 'vs-dark', bg: '#282a36', side: '#21222c', border: '#191a21', text: '#f8f8f2', muted: '#6272a4', bright: '#ffffff', accent: '#bd93f9', hover: '#343746', sel: '#44475a', kw: '#ff79c6', str: '#f1fa8c', com: '#6272a4', fn: '#50fa7b', num: '#bd93f9', type: '#8be9fd' },
  monokai: { n: 'Monokai', b: 'vs-dark', bg: '#272822', side: '#1e1f1c', border: '#141411', text: '#f8f8f2', muted: '#75715e', bright: '#ffffff', accent: '#a6921b', hover: '#33342d', sel: '#49483e', kw: '#f92672', str: '#e6db74', com: '#75715e', fn: '#a6e22e', num: '#ae81ff', type: '#66d9ef' },
  cyberpunk: { n: 'Cyberpunk Neon', b: 'vs-dark', bg: '#0d0221', side: '#02010a', border: '#1a0b3b', text: '#00f0ff', muted: '#6b5b95', bright: '#ffffff', accent: '#d1145a', hover: '#1a0b3b', sel: '#2d1b5e', kw: '#ff2a6d', str: '#05ffa1', com: '#6b5b95', fn: '#00f0ff', num: '#fffb96', type: '#d1f7ff' }
};
const DEF = { theme: 'one-dark', fontSize: 14, fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace", lineHeight: 0, tabSize: 4, wordWrap: false, minimap: true, lineNumbers: true, ligatures: true, autoSave: false, cursorStyle: 'line', cursorBlinking: 'smooth', whitespace: 'selection', lineHighlight: 'all', smoothCaret: true, bracketPairs: true, autoClose: true, formatOnPaste: true, scrollBeyond: false, stickyScroll: false, mouseWheelZoom: true, restoreSession: true, trimOnSave: false, finalNewline: false, termFontSize: 14, termCursor: 'bar', termBlink: true, scrollback: 10000, copyOnSelect: false, gpu: true };
const SCHEMA = [
  ['restoreSession', 'Restore Session', 'Reopen the last folder and tabs when Arcaw starts', 'bool', null, 'core'],
  ['autoSave', 'Auto Save', 'Save files one second after you stop typing', 'bool', null, 'core'],
  ['trimOnSave', 'Trim Trailing Whitespace', 'Remove spaces at line ends when saving', 'bool', null, 'core'],
  ['finalNewline', 'Ensure Final Newline', 'Add a newline at the end of the file when saving', 'bool', null, 'core'],
  ['fontSize', 'Font Size', 'Editor font size in pixels', 'number', [8, 40], 'editor'],
  ['fontFamily', 'Font Family', 'Install the font on your system to use it', 'select', [["'JetBrains Mono','Fira Code',Consolas,monospace", 'JetBrains Mono / Fira Code'], ['Consolas,monospace', 'Consolas'], ["'Cascadia Code',Consolas,monospace", 'Cascadia Code'], ["'Courier New',monospace", 'Courier New']], 'editor'],
  ['lineHeight', 'Line Height', 'Pixels. 0 = automatic', 'number', [0, 80], 'editor'],
  ['tabSize', 'Tab Length', 'Number of spaces per tab', 'number', [1, 8], 'editor'],
  ['wordWrap', 'Soft Wrap', 'Wrap lines that exceed the viewport width', 'bool', null, 'editor'],
  ['lineNumbers', 'Show Line Numbers', '', 'bool', null, 'editor'],
  ['minimap', 'Show Minimap', 'Code overview on the right side', 'bool', null, 'editor'],
  ['cursorStyle', 'Cursor Style', '', 'select', [['line', 'Line'], ['block', 'Block'], ['underline', 'Underline']], 'editor'],
  ['cursorBlinking', 'Cursor Blinking', '', 'select', [['blink', 'Blink'], ['smooth', 'Smooth'], ['phase', 'Phase'], ['expand', 'Expand'], ['solid', 'Solid']], 'editor'],
  ['smoothCaret', 'Smooth Caret Animation', '', 'bool', null, 'editor'],
  ['whitespace', 'Show Invisibles', 'Render whitespace characters', 'select', [['none', 'None'], ['selection', 'Selection'], ['all', 'All']], 'editor'],
  ['lineHighlight', 'Highlight Current Line', '', 'select', [['none', 'None'], ['gutter', 'Gutter'], ['line', 'Line'], ['all', 'All']], 'editor'],
  ['ligatures', 'Font Ligatures', 'Combine characters like => and !==', 'bool', null, 'editor'],
  ['bracketPairs', 'Colorize Bracket Pairs', '', 'bool', null, 'editor'],
  ['autoClose', 'Auto Close Brackets and Quotes', '', 'bool', null, 'editor'],
  ['formatOnPaste', 'Format on Paste', '', 'bool', null, 'editor'],
  ['stickyScroll', 'Sticky Scroll', 'Keep the current scope header visible', 'bool', null, 'editor'],
  ['scrollBeyond', 'Scroll Past End', 'Allow scrolling beyond the last line', 'bool', null, 'editor'],
  ['mouseWheelZoom', 'Ctrl + Wheel Zoom', 'Change font size with Ctrl and mouse wheel', 'bool', null, 'editor'],
  ['termFontSize', 'Font Size', 'Terminal font size in pixels', 'number', [8, 40], 'terminal'],
  ['termCursor', 'Cursor Style', '', 'select', [['bar', 'Bar'], ['block', 'Block'], ['underline', 'Underline']], 'terminal'],
  ['termBlink', 'Cursor Blinking', '', 'bool', null, 'terminal'],
  ['scrollback', 'Scrollback Lines', 'How many lines of history each terminal keeps', 'number', [500, 100000], 'terminal'],
  ['copyOnSelect', 'Copy on Select', 'Copy selected text to the clipboard automatically', 'bool', null, 'terminal'],
  ['gpu', 'GPU Acceleration', 'WebGL renderer for fast output. Applies to new terminals', 'bool', null, 'terminal']
];

/* ---------- State ---------- */
let S = { ...DEF }, st = {}, editor, root = null, active = null, order = [], expanded = new Set();
const files = new Map();
let sideView = 'explorer', sideW = 260, panelH = 200, fileIndex = [], selected = null, saveT;

const snapshot = () => ({ settings: S, folder: root, expanded: [...expanded], tabs: order.filter(p => !isVirtual(p)), active: isVirtual(active) ? null : active, sideW, panelH, sideView, terms: terms.map(t => ({ name: t.name, cwd: t.cwd, shell: t.shell })) });
const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => api.state_set(snapshot()), 400); };
const toast = (t, k = '') => { const d = el('div', 'toast ' + k, (k === 'ok' ? '<i class="fa-solid fa-circle-check"></i>' : k === 'err' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '') + '<span>' + esc(t) + '</span>'); $('#toasts').append(d); setTimeout(() => d.remove(), 3200); };

/* ---------- Modal helpers ---------- */
function modal(html, cls = '') { disposeDiff(); const b = $('#modal-box'); b.className = cls; $('#modal').classList.toggle('wide', cls === 'wide'); b.innerHTML = html; $('#modal').classList.remove('hidden'); return b; }
function closeModal() { disposeDiff(); $('#modal').classList.add('hidden'); $('#modal-box').innerHTML = ''; if (editor) editor.focus(); }
$('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal') closeModal(); });
function ask(title, val = '') {
  return new Promise(res => {
    const b = modal(`<div class="mh">${esc(title)}</div><div class="mbody"><input id="ask-in" value="${esc(val)}"></div>`);
    const i = b.querySelector('#ask-in'); i.focus(); i.select();
    i.onkeydown = e => { if (e.key === 'Enter') { closeModal(); res(i.value.trim() || null); } else if (e.key === 'Escape') { closeModal(); res(null); } };
  });
}

/* ---------- Theme & settings ---------- */
function defineThemes() {
  for (const [id, t] of Object.entries(THEMES)) {
    const f = c => c.replace('#', '');
    monaco.editor.defineTheme(id, {
      base: t.b, inherit: true,
      rules: [{ token: 'keyword', foreground: f(t.kw) }, { token: 'string', foreground: f(t.str) }, { token: 'comment', foreground: f(t.com), fontStyle: 'italic' }, { token: 'number', foreground: f(t.num) }, { token: 'type', foreground: f(t.type) }, { token: 'tag', foreground: f(t.kw) }, { token: 'attribute.name', foreground: f(t.num) }, { token: 'entity.name.function', foreground: f(t.fn) }],
      colors: { 'editor.background': t.bg, 'editor.foreground': t.text, 'editor.lineHighlightBackground': t.hover, 'editor.selectionBackground': t.sel, 'editorLineNumber.foreground': t.muted, 'editorLineNumber.activeForeground': t.bright, 'editorCursor.foreground': t.accent, 'editorGutter.background': t.bg, 'minimap.background': t.bg, 'editorWidget.background': t.side, 'editorSuggestWidget.background': t.side }
    });
  }
}
function applyTheme() {
  const t = THEMES[S.theme] || THEMES['one-dark'], r = document.documentElement.style;
  ['bg', 'side', 'border', 'text', 'muted', 'bright', 'accent', 'hover', 'sel'].forEach(k => r.setProperty('--' + k, t[k]));
  if (window.monaco && window.monaco.editor) monaco.editor.setTheme(S.theme);
}
function applySettings() {
  applyTheme();
  if (editor) editor.updateOptions({ fontSize: S.fontSize, fontFamily: S.fontFamily, lineHeight: S.lineHeight, fontLigatures: S.ligatures, tabSize: S.tabSize, wordWrap: S.wordWrap ? 'on' : 'off', minimap: { enabled: S.minimap }, lineNumbers: S.lineNumbers ? 'on' : 'off', cursorStyle: S.cursorStyle, cursorBlinking: S.cursorBlinking, renderWhitespace: S.whitespace, renderLineHighlight: S.lineHighlight, cursorSmoothCaretAnimation: S.smoothCaret ? 'on' : 'off', bracketPairColorization: { enabled: S.bracketPairs }, autoClosingBrackets: S.autoClose ? 'languageDefined' : 'never', autoClosingQuotes: S.autoClose ? 'languageDefined' : 'never', formatOnPaste: S.formatOnPaste, stickyScroll: { enabled: S.stickyScroll }, scrollBeyondLastLine: S.scrollBeyond, mouseWheelZoom: S.mouseWheelZoom });
  $('#st-tab').textContent = 'Spaces: ' + S.tabSize;
  if (typeof applyTermOptions === 'function') applyTermOptions();
  persist();
}
const SETTINGS = 'arcaw://settings', WELCOME = 'arcaw://welcome';
const isVirtual = p => p === SETTINGS || p === WELCOME;
const SETNAV = [['core', 'Core', 'fa-sliders'], ['editor', 'Editor', 'fa-code'], ['terminal', 'Terminal', 'fa-terminal'], ['themes', 'Themes', 'fa-palette'], ['keys', 'Keybindings', 'fa-keyboard'], ['packages', 'Packages', 'fa-cubes'], ['system', 'System', 'fa-desktop']];
let setCat = 'core';
function control(k, type, opts) {
  let c;
  if (type === 'select') { c = el('select', '', opts.map(([v, l]) => `<option value="${esc(v)}" ${S[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')); c.onchange = () => { S[k] = c.value; applySettings(); }; }
  else if (type === 'number') { c = el('input'); c.type = 'number'; c.min = opts[0]; c.max = opts[1]; c.value = S[k]; c.style.width = '90px'; c.onchange = () => { const v = +c.value; S[k] = isNaN(v) ? DEF[k] : clamp(v, opts[0], opts[1]); c.value = S[k]; applySettings(); }; }
  else { c = el('input'); c.type = 'checkbox'; c.checked = !!S[k]; c.onchange = () => { S[k] = c.checked; applySettings(); }; }
  return c;
}
function renderSettings() {
  const box = $('#settings'); box.innerHTML = '';
  const nav = el('div', 'sn', '<div class="sn-t"><i class="fa-solid fa-gear"></i> Settings</div>');
  for (const [id, l, ic] of SETNAV) { const b = el('button', 'sn-i' + (id === setCat ? ' on' : ''), `<i class="fa-solid ${ic}"></i>${l}`); b.onclick = () => { setCat = id; renderSettings(); }; nav.append(b); }
  const cfg = el('button', 'sn-cfg', '<i class="fa-solid fa-folder-open"></i> Open Config Folder'); cfg.onclick = () => api.app_config(); nav.append(cfg);
  const main = el('div', 'sm'), body = el('div'); main.append(body); box.append(nav, main);
  const head = (t, d) => body.append(el('h2', '', t), el('p', 'd', d));
  if (['core', 'editor', 'terminal'].includes(setCat)) {
    head({ core: 'Core Settings', editor: 'Editor Settings', terminal: 'Terminal Settings' }[setCat], { core: 'Behavior unrelated to text editing.', editor: 'Settings that change how text is displayed and edited. Changes apply instantly.', terminal: 'Integrated terminal appearance and behavior.' }[setCat]);
    for (const [k, name, desc, type, opts, cat] of SCHEMA) if (cat === setCat) { const row = el('div', 'set', `<div><b>${name}</b><small>${desc}</small></div>`); row.append(control(k, type, opts)); body.append(row); }
  } else if (setCat === 'themes') {
    head('Themes', 'Choose a color theme for the interface and syntax.');
    const g = el('div', 'tcards');
    for (const [k, t] of Object.entries(THEMES)) { const c = el('div', 'tc' + (k === S.theme ? ' on' : ''), `<div class="sw" style="background:${t.bg}"><span style="background:${t.side}"></span><i style="background:${t.accent}"></i><i style="background:${t.kw}"></i><i style="background:${t.str}"></i><i style="background:${t.fn}"></i></div><b>${t.n}</b>`); c.onclick = () => { S.theme = k; applySettings(); renderSettings(); }; g.append(c); }
    body.append(g);
  } else if (setCat === 'keys') {
    head('Keybindings', 'Shortcuts for every command. Press Ctrl+Shift+P to run any command by name.');
    const f = el('input'); f.placeholder = 'Filter commands…'; f.style.cssText = 'width:100%;margin-bottom:10px'; const list = el('div');
    const draw = () => { list.innerHTML = ''; CMDS.filter(c => c[0].toLowerCase().includes(f.value.toLowerCase())).forEach(c => list.append(el('div', 'kb', `<span>${esc(c[0])}</span>${c[1] ? `<kbd>${esc(c[1])}</kbd>` : '<span></span>'}`))); };
    f.oninput = draw; draw(); body.append(f, list);
  } else if (setCat === 'packages') {
    head('Packages', 'Components bundled with Arcaw.');
    const nLang = window.monaco && monaco.languages ? monaco.languages.getLanguages().length : '—';
    for (const [n, v, d] of [['monaco-editor', '0.52.2', `Core editor engine with ${nLang} language grammars, IntelliSense for JS/TS/JSON/CSS/HTML`], ['icons', 'built-in', 'Outline icon set bundled with the app'], ['git integration', 'built-in', 'Status, stage, unstage and commit using your installed git'], ['terminal', 'built-in', 'Multiple terminal sessions in your system shell']]) body.append(el('div', 'pk', `<b>${n}</b><small>${v}</small><div>${d}</div>`));
  } else {
    head('System', 'Information about this installation.');
    api.app_info().then(i => { body.append(...[['Version', i.version], ['Electron', i.electron], ['Chromium', i.chrome], ['Node.js', i.node], ['Platform', i.platform], ['Config folder', i.userData]].map(([a1, b1]) => el('div', 'kb', `<span>${a1}</span><span>${esc(b1)}</span>`))); });
  }
}
function openWelcome() { if (!order.includes(WELCOME)) order.unshift(WELCOME); activate(WELCOME); }
function openSettings() { if (!order.includes(SETTINGS)) order.push(SETTINGS); activate(SETTINGS); }
window.closeModal = closeModal;

/* ---------- Files, tabs, editor ---------- */
const langName = id => { const l = monaco.languages.getLanguages().find(x => x.id === id); return l ? (l.aliases && l.aliases[0]) || id : id; };
function updateStatus() {
  const f = files.get(active);
  $('#st-lang').textContent = f ? langName(f.model.getLanguageId()) : '';
  $('#st-eol').textContent = f ? (f.model.getEOL() === '\n' ? 'LF' : 'CRLF') : '';
  $('#st-saved').innerHTML = f ? (f.dirty ? '<i class="fa-solid fa-circle" style="font-size:7px;color:#e5c07b"></i> Unsaved' : '<i class="fa-solid fa-check"></i> Saved') : '';
  $('#wtitle').textContent = (f ? base(active) + ' — ' : active === SETTINGS ? 'Settings — ' : '') + (root ? base(root) + ' — ' : '') + 'Arcaw';
}
function renderTabs() {
  const box = $('#tabs'); box.innerHTML = '';
  for (const p of order) {
    const f = files.get(p), isS = p === SETTINGS, isW = p === WELCOME;
    const t = el('div', 'tab tab-item' + (p === active ? ' on' : ''));
    t.title = isW ? 'Welcome' : p;

    // Sizin istediğiniz HTML yapısına göre oluşturulan kısım:
    t.innerHTML = `
      <div class="tab-left">
        <i class="${isS ? 'fa-solid fa-sliders' : isW ? 'fa-brands fa-atom' : iconFor({ name: base(p) })}"></i>
        <span class="tab-title">${isS ? 'Settings' : isW ? 'Welcome' : esc(base(p))}</span>
      </div>
      <span class="cl tab-close">${f && f.dirty ? '<i class="fa-solid fa-circle dot"></i>' : '<i class="fa-solid fa-xmark"></i>'}</span>
    `;

    t.onclick = () => activate(p);
    t.oncontextmenu = e => { e.preventDefault(); tabMenu(e, p); };
    t.onauxclick = e => { if (e.button === 1) closeTab(p); };
    t.querySelector('.cl').onclick = e => { e.stopPropagation(); closeTab(p); };
    box.append(t);
    if (p === active) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
async function openFile(p, line, keepFocus) {
  if (!editor) return toast('Editor is still loading…');
  let f = files.get(p);
  if (!f) {
    let text; try { text = await api.fs_read(p); } catch (e) { return toast(clean(e), 'err'); }
    const model = monaco.editor.createModel(text, undefined, monaco.Uri.file(p));
    f = { model, view: null, saved: model.getAlternativeVersionId(), dirty: false };
    model.onDidChangeContent(() => {
      const d = model.getAlternativeVersionId() !== f.saved;
      if (d !== f.dirty) { f.dirty = d; renderTabs(); updateStatus(); }
      if (S.autoSave && d) { clearTimeout(f.t); f.t = setTimeout(() => save(p), 1000); }
    });
    files.set(p, f); order.push(p);
  }
  activate(p);
  if (line) { editor.revealLineInCenter(line); editor.setPosition({ lineNumber: line, column: 1 }); }
  if (!keepFocus) editor.focus();   // a single click in the explorer keeps focus there so Delete / Ctrl+C / Ctrl+X still act on files
}
function activate(p) {
  if (active && files.has(active) && editor) files.get(active).view = editor.saveViewState();
  active = p; const isS = p === SETTINGS, isW = p === WELCOME; if (!isVirtual(p)) { selected = p; if (!sels.has(p)) { sels = new Set([p]); anchor = p; } }
  $('#welcome').classList.toggle('hidden', !isW); $('#settings').classList.toggle('hidden', !isS);
  if (isS) renderSettings(); else if (isW) { if (editor) editor.setModel(null); } else { const f = files.get(p); editor.setModel(f.model); if (f.view) editor.restoreViewState(f.view); }
  renderTabs(); updateStatus(); markTree(); persist();
}
// nothing left open: the editor area is simply empty (no page is forced back on screen)
function showWelcome() { active = null; $('#settings').classList.add('hidden'); $('#welcome').classList.add('hidden'); if (editor) editor.setModel(null); renderTabs(); updateStatus(); persist(); }
async function save(p = active) {
  const f = files.get(p); if (!f) return;
  if (S.trimOnSave || S.finalNewline) {
    let t = f.model.getValue(); const o = t; if (S.trimOnSave) t = t.replace(/[ \t]+$/gm, ''); if (S.finalNewline && t && !t.endsWith('\n')) t += '\n';
    if (t !== o) f.model.pushEditOperations([], [{ range: f.model.getFullModelRange(), text: t }], () => null);
  }
  try { await api.fs_write(p, f.model.getValue()); f.saved = f.model.getAlternativeVersionId(); f.dirty = false; renderTabs(); updateStatus(); refreshGit(); }
  catch (e) { toast('Save failed: ' + clean(e), 'err'); }
}
const saveAll = async () => { for (const p of order) if (files.get(p) && files.get(p).dirty) await save(p); toast('All files saved', 'ok'); };
async function closeTab(p) {
  if (isVirtual(p)) { order = order.filter(x => x !== p); if (active === p) { active = null; const n = order[order.length - 1]; n ? activate(n) : showWelcome(); } else { renderTabs(); persist(); } return true; }
  const f = files.get(p); if (!f) return true;
  if (f.dirty) { const r = await api.dlg_confirm(`Save changes to ${base(p)}?`, ['Save', "Don't Save", 'Cancel']); if (r === 2) return false; if (r === 0) await save(p); }
  f.model.dispose(); files.delete(p); order = order.filter(x => x !== p);
  if (active === p) { active = null; const n = order[order.length - 1]; n ? activate(n) : showWelcome(); } else { renderTabs(); persist(); }
  return true;
}

/* ---------- Explorer ---------- */
const ICONS = { js: 'fa-brands fa-js #e5c07b', mjs: 'fa-brands fa-js #e5c07b', ts: 'fa-solid fa-file-code #61afef', tsx: 'fa-brands fa-react #61afef', jsx: 'fa-brands fa-react #61afef', html: 'fa-brands fa-html5 #e06c75', css: 'fa-brands fa-css3-alt #61afef', json: 'fa-solid fa-brackets-curly #e5c07b', md: 'fa-brands fa-markdown #c678dd', py: 'fa-brands fa-python #56b6c2', cpp: 'fa-solid fa-file-code #61afef', c: 'fa-solid fa-file-code #61afef', h: 'fa-solid fa-file-code #c678dd', java: 'fa-brands fa-java #e06c75', rs: 'fa-brands fa-rust #d19a66', go: 'fa-solid fa-file-code #56b6c2', php: 'fa-brands fa-php #c678dd', png: 'fa-regular fa-image #98c379', jpg: 'fa-regular fa-image #98c379', svg: 'fa-regular fa-image #98c379', txt: 'fa-regular fa-file-lines #abb2bf' };
function iconFor(it) {
  if (it.dir) return 'fa-solid fa-folder #e5c07b';
  const e = (it.name.split('.').pop() || '').toLowerCase(); const v = ICONS[e] || 'fa-regular fa-file #abb2bf';
  const i = v.lastIndexOf(' '); return v.slice(0, i) + '" style="color:' + v.slice(i + 1);
}
const kinds = new Map();               // path -> is directory (filled while the tree renders)
let sels = new Set(), anchor = null, clip = { paths: [], cut: false }, dragPaths = [];
const isDirPath = p => kinds.get(p) === true;
const visiblePaths = () => [...document.querySelectorAll('#tree .row[data-path]')].map(r => r.dataset.path);
const inside = (c, p) => c === p || c.startsWith(p + sepOf(p));
const relPath = p => (root && inside(p, root) ? p.slice(root.length).replace(/^[\\/]/, '') || '.' : p);
function selectOnly(p) { sels = new Set(p ? [p] : []); selected = p; anchor = p; markTree(); }
function toggleDir(p, force) { const on = force ?? !expanded.has(p); if (on) expanded.add(p); else expanded.delete(p); refreshTree(); persist(); }
function rowClick(e, it) {
  if (e.shiftKey && anchor) {
    const v = visiblePaths(), a = v.indexOf(anchor), b = v.indexOf(it.path);
    if (a >= 0 && b >= 0) { sels = new Set(v.slice(Math.min(a, b), Math.max(a, b) + 1)); selected = it.path; markTree(); return; }
  }
  if (e.ctrlKey || e.metaKey) { if (sels.has(it.path)) sels.delete(it.path); else sels.add(it.path); selected = it.path; anchor = it.path; markTree(); return; }
  selectOnly(it.path);
  if (it.dir) toggleDir(it.path); else openFile(it.path, 0, true);
}
async function renderDir(d, depth, parent) {
  let items; try { items = await api.fs_readdir(d); } catch { return; }
  for (const it of items) {
    kinds.set(it.path, it.dir);
    const row = el('div', 'row'); row.style.paddingLeft = 8 + depth * 14 + 'px'; row.dataset.path = it.path; row.draggable = true;
    row.innerHTML = (it.dir ? `<i class="fa-solid fa-chevron-${expanded.has(it.path) ? 'down' : 'right'} chev"></i>` : '<i></i>') + `<i class="${iconFor(it)}"></i><span>${esc(it.name)}</span>`;
    parent.append(row);
    row.oncontextmenu = e => { e.preventDefault(); ctxMenu(e, it); };
    row.onclick = e => rowClick(e, it);
    if (!it.dir) row.ondblclick = () => openFile(it.path);
    if (it.dir && expanded.has(it.path)) { const box = el('div'); parent.append(box); await renderDir(it.path, depth + 1, box); }
  }
}
let treeBusy = false, treeAgain = false;
async function refreshTree() {
  if (treeBusy) { treeAgain = true; return; } treeBusy = true;
  try {
    const t = $('#tree'), keep = $('#v-explorer').scrollTop; const frag = el('div');
    if (!root) frag.innerHTML = '<div class="pad"><button class="btn" data-cmd="File: Open Folder…">Open Folder</button><span style="color:var(--muted)">No folder opened yet.</span></div>';
    else { const h = el('div', 'row', `<i class="fa-solid fa-folder-open" style="color:#e5c07b"></i><b>${esc(base(root).toUpperCase())}</b>`); h.style.paddingLeft = '8px'; frag.append(h); await renderDir(root, 1, frag); }
    t.replaceChildren(...frag.childNodes); $('#v-explorer').scrollTop = keep; markTree();
  } finally { treeBusy = false; if (treeAgain) { treeAgain = false; refreshTree(); } }
}
const markTree = () => document.querySelectorAll('#tree .row').forEach(r => { const p = r.dataset.path; r.classList.toggle('sel', !!p && sels.has(p)); r.classList.toggle('cut', !!p && clip.cut && clip.paths.includes(p)); });
async function indexFiles() { fileIndex = root ? await api.fs_list(root) : []; }
const targetDir = () => !root ? null : !selected ? root : (isDirPath(selected) ? selected : dirOf(selected));
async function newItem(isDir, parent) {
  parent = parent || targetDir(); if (!root) return toast('Open a folder first', 'err');
  const n = await ask(isDir ? 'New folder name' : 'New file name'); if (!n) return;
  try { const p = join(parent, n); await api.fs_create(p, isDir); expanded.add(parent); await refreshTree(); indexFiles(); refreshGit(); selectOnly(p); if (!isDir) openFile(p); }
  catch (e) { toast(clean(e), 'err'); }
}
async function renameItem(it) {
  const n = await ask('Rename to', it.name); if (!n || n === it.name) return;
  const np = join(dirOf(it.path), n), affected = order.filter(p => inside(p, it.path));
  for (const p of affected) if (!(await closeTab(p))) return;
  try { await api.fs_rename(it.path, np); await refreshTree(); indexFiles(); refreshGit(); selectOnly(np); if (!it.dir) openFile(np); } catch (e) { toast(clean(e), 'err'); }
}
async function deleteItems(paths) {
  paths = paths.filter(p => p && p !== root); if (!paths.length) return;
  const msg = paths.length === 1 ? `Move "${base(paths[0])}" to the Recycle Bin?` : `Move ${paths.length} items to the Recycle Bin?`;
  if ((await api.dlg_confirm(msg, ['Move to Trash', 'Cancel'])) !== 0) return;
  let n = 0;
  for (const p of paths) {
    for (const t of order.filter(x => inside(x, p))) { if (files.get(t)) files.get(t).dirty = false; await closeTab(t); }
    try { await api.fs_delete(p); n++; } catch (e) { toast(clean(e), 'err'); }
  }
  sels = new Set(); selected = null; anchor = null; clip.paths = clip.paths.filter(x => !paths.some(p => inside(x, p)));
  await refreshTree(); indexFiles(); refreshGit(); if (n) toast(n === 1 ? 'Moved to the Recycle Bin' : `${n} items moved to the Recycle Bin`, 'ok');
}
/* copy / cut / paste / drag & drop */
function copySel(paths) { paths = paths.filter(p => p && p !== root); if (!paths.length) return; clip = { paths: [...paths], cut: false }; markTree(); toast(paths.length === 1 ? 'Copied' : `Copied ${paths.length} items`, 'ok'); }
function cutSel(paths) { paths = paths.filter(p => p && p !== root); if (!paths.length) return; clip = { paths: [...paths], cut: true }; markTree(); toast(paths.length === 1 ? 'Cut — paste to move' : `Cut ${paths.length} items — paste to move`, 'ok'); }
async function transfer(paths, dest, move) {
  if (!root || !dest || !paths.length) return;
  const out = []; let skipped = false;
  for (const src of paths) {
    const name = base(src); let target = join(dest, name), replace = false;
    try {
      if (move) {
        if (dirOf(src) === dest) continue;
        if (inside(dest, src)) { toast(`Cannot move "${name}" into itself`, 'err'); continue; }
        if (await api.fs_exists(target)) {
          const r = await api.dlg_confirm(`"${name}" already exists in this folder.`, ['Replace', 'Keep Both', 'Cancel']);
          if (r === 2) { skipped = true; break; }
          if (r === 1) target = await api.fs_unique(dest, name); else replace = true;
        }
        for (const t of order.filter(x => inside(x, src))) if (!(await closeTab(t))) throw new Error('cancelled');
        if (replace) for (const t of order.filter(x => inside(x, target))) { if (files.get(t)) files.get(t).dirty = false; await closeTab(t); }
        await api.fs_move(src, target, replace);
      } else {
        if (inside(dest, src)) { toast(`Cannot copy "${name}" into itself`, 'err'); continue; }
        if (await api.fs_exists(target)) target = await api.fs_unique(dest, name);
        await api.fs_copy(src, target);
      }
      out.push(target);
    } catch (e) { if (e.message === 'cancelled') { skipped = true; break; } toast(clean(e), 'err'); }
  }
  if (move && !skipped) clip = { paths: [], cut: false };
  expanded.add(dest); await refreshTree(); indexFiles(); refreshGit();
  if (out.length) { sels = new Set(out); selected = anchor = out[out.length - 1]; markTree(); toast(`${move ? 'Moved' : 'Pasted'} ${out.length === 1 ? base(out[0]) : out.length + ' items'}`, 'ok'); }
}
const pasteInto = dest => transfer(clip.paths, dest || targetDir(), clip.cut);
function copyPaths(paths, rel) {
  paths = paths.filter(Boolean); if (!paths.length) return;
  navigator.clipboard.writeText(paths.map(p => (rel ? relPath(p) : p)).join('\n')).then(() => toast(paths.length > 1 ? 'Paths copied' : rel ? 'Relative path copied' : 'Path copied', 'ok'), () => toast('Could not access the clipboard', 'err'));
}
const inExplorerFocus = () => !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('#v-explorer'));
const contextPaths = () => (inExplorerFocus() && sels.size ? [...sels] : active && files.has(active) ? [active] : []);
function popup(x, y, items) {
  const c = $('#ctx'); c.innerHTML = '';
  items.forEach(it => {
    if (it === '-') { c.append(el('hr')); return; }
    const d = el('div', it[3] ? 'dis' : '', `<span>${esc(it[0])}</span>${it[2] ? `<small>${esc(it[2])}</small>` : ''}`);
    if (!it[3]) d.onclick = () => { c.classList.add('hidden'); it[1](); };
    c.append(d);
  });
  c.classList.remove('hidden');
  c.style.left = Math.max(0, Math.min(x, innerWidth - c.offsetWidth - 4)) + 'px'; c.style.top = Math.max(0, Math.min(y, innerHeight - c.offsetHeight - 4)) + 'px';
}
function ctxMenu(e, it) {
  if (!it.root && !sels.has(it.path)) selectOnly(it.path);
  const paths = it.root ? [root] : [...sels], multi = paths.length > 1, d = it.dir ? it.path : dirOf(it.path);
  popup(e.clientX, e.clientY, [
    ['New File', () => newItem(false, d)], ['New Folder', () => newItem(true, d)], '-',
    ['Cut', () => cutSel(paths), 'Ctrl+X', !!it.root], ['Copy', () => copySel(paths), 'Ctrl+C', !!it.root], ['Paste', () => pasteInto(d), 'Ctrl+V', !clip.paths.length], '-',
    ['Copy Path', () => copyPaths(paths, false), 'Alt+Shift+C'], ['Copy Relative Path', () => copyPaths(paths, true), 'Ctrl+Alt+Shift+C'], '-',
    ['Rename', () => renameItem(it), 'F2', multi || !!it.root], ['Delete', () => deleteItems(paths), 'Del', !!it.root], '-',
    ['Reveal in File Explorer', () => api.fs_reveal(paths[0]), '', multi]]);
}
function tabMenu(e, p) {
  const real = !isVirtual(p), closeOthers = async () => { for (const x of [...order]) if (x !== p && !(await closeTab(x))) return; activate(p); };
  popup(e.clientX, e.clientY, [['Close', () => closeTab(p), 'Ctrl+W'], ['Close Others', closeOthers, '', order.length < 2], ['Close All', async () => { for (const x of [...order]) if (!(await closeTab(x))) return; }],
  ...(real ? ['-', ['Copy Path', () => copyPaths([p], false)], ['Copy Relative Path', () => copyPaths([p], true)], ['Reveal in File Explorer', () => api.fs_reveal(p)]] : [])]);
}
function explorerNav(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  const v = visiblePaths(); if (!v.length) return false;
  const cur = v.indexOf(selected);
  const go = d => {
    const i = clamp((cur < 0 ? 0 : cur) + d, 0, v.length - 1), p = v[i];
    if (e.shiftKey) { const a = v.indexOf(anchor), b = a < 0 ? i : a; sels = new Set(v.slice(Math.min(b, i), Math.max(b, i) + 1)); selected = p; markTree(); }
    else selectOnly(p);
    const r = [...document.querySelectorAll('#tree .row[data-path]')][i]; if (r) r.scrollIntoView({ block: 'nearest' });
  };
  if (e.key === 'ArrowDown') { go(1); return true; }
  if (e.key === 'ArrowUp') { go(-1); return true; }
  if (e.key === 'Enter' && selected) { if (isDirPath(selected)) toggleDir(selected); else openFile(selected); return true; }  // Enter = open and move to the editor
  if (e.key === 'ArrowRight' && selected && isDirPath(selected)) { if (!expanded.has(selected)) toggleDir(selected, true); else go(1); return true; }
  if (e.key === 'ArrowLeft' && selected) { if (isDirPath(selected) && expanded.has(selected)) toggleDir(selected, false); else if (dirOf(selected) && dirOf(selected) !== root && v.includes(dirOf(selected))) selectOnly(dirOf(selected)); return true; }
  return false;
}
function initExplorerUI() {
  const ex = $('#v-explorer');
  ex.addEventListener('contextmenu', e => { if (e.target.closest('.row[data-path]') || !root) return; e.preventDefault(); ctxMenu(e, { path: root, dir: true, root: true, name: base(root) }); });
  const internal = e => !!e.dataTransfer && [...e.dataTransfer.types].includes('application/x-arcaw-paths');
  const clearDrop = () => document.querySelectorAll('#tree .row.drop').forEach(r => r.classList.remove('drop'));
  const dropDir = e => { const r = e.target.closest && e.target.closest('.row[data-path]'); if (!r) return root; const p = r.dataset.path; return isDirPath(p) ? p : dirOf(p); };
  ex.addEventListener('dragstart', e => {
    const r = e.target.closest('.row[data-path]'); if (!r) return;
    if (!sels.has(r.dataset.path)) selectOnly(r.dataset.path);
    dragPaths = [...sels]; e.dataTransfer.setData('application/x-arcaw-paths', JSON.stringify(dragPaths)); e.dataTransfer.effectAllowed = 'copyMove';
  });
  ex.addEventListener('dragover', e => {
    if (!internal(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = e.ctrlKey || e.altKey ? 'copy' : 'move'; clearDrop();
    const d = dropDir(e), r = [...document.querySelectorAll('#tree .row[data-path]')].find(x => x.dataset.path === d); if (r) r.classList.add('drop');
  });
  ex.addEventListener('dragleave', e => { if (!ex.contains(e.relatedTarget)) clearDrop(); });
  ex.addEventListener('dragend', clearDrop);
  ex.addEventListener('drop', e => {
    if (!internal(e)) return; e.preventDefault(); e.stopPropagation(); clearDrop();
    const paths = dragPaths.slice(), d = dropDir(e); dragPaths = []; transfer(paths, d, !(e.ctrlKey || e.altKey));
  });
}
document.addEventListener('mousedown', e => { if (!e.target.closest('#ctx')) $('#ctx').classList.add('hidden'); if (!e.target.closest('.mb')) document.querySelectorAll('.mb.open').forEach(m => m.classList.remove('open')); });

async function setFolder(d) {
  for (const p of [...order]) if (!(await closeTab(p))) return;
  root = d; expanded = new Set(); selected = null; G.top = null; G.state = 'none'; runSearch();
  await refreshTree(); indexFiles(); refreshGit(); updateStatus(); persist();
}
async function openFolder() { const d = await api.dlg_folder(); if (d) setFolder(d); }
async function openFiles() { for (const p of await api.dlg_files()) await openFile(p); }

/* ---------- Search ---------- */
let searchSeq = 0, searchT = 0;
async function runSearch() {
  const q = $('#s-in').value, out = $('#s-out'), head = $('#s-head'), seq = ++searchSeq;
  if (!q || !root) { head.textContent = 'RESULTS (0)'; out.innerHTML = `<div class="s-empty">${root ? 'Type to search files and code...' : 'Open a folder to search its files.'}</div>`; return; }
  head.textContent = 'SEARCHING…';
  let res = []; try { res = await api.fs_search(root, q, $('#s-case').checked); } catch (e) { toast(clean(e), 'err'); }
  if (seq !== searchSeq) return;
  head.textContent = `RESULTS (${res.length}${res.length >= 500 ? '+' : ''})`; out.innerHTML = '';
  if (!res.length) { out.innerHTML = '<div class="s-empty">No results found.</div>'; return; }
  let cur = null;
  for (const r of res) {
    if (r.file !== cur) { cur = r.file; out.append(el('div', 'sr-f', `<i class="${iconFor({ name: base(r.file) })}"></i><span>${esc(r.file.slice(root.length + 1))}</span>`)); }
    const l = el('div', 'sr-l', `<b>${r.line}</b>${esc(r.text)}`); l.onclick = () => openFile(r.file, r.line); out.append(l);
  }
}

/* ---------- Source control ---------- */
const G = { state: 'none', err: '', top: null, branch: '', upstream: '', ahead: 0, behind: 0, detached: false, remotes: [], staged: [], changes: [], conflicts: [], log: [], busy: '', open: { conflicts: true, staged: true, changes: true, history: true } };
const GCOL = { M: '#e5c07b', A: '#98c379', D: '#e06c75', R: '#61afef', C: '#61afef', T: '#c678dd', U: '#98c379', '!': '#e06c75' };
const GNAME = { M: 'Modified', A: 'Added', D: 'Deleted', R: 'Renamed', C: 'Copied', T: 'Type changed', U: 'Untracked', '!': 'Merge conflict' };
// every command runs from the repository top-level, so repo-relative paths from `git status` are always correct
const gitRun = args => api.git(G.top || root, args);
const gitAbs = rel => { const p = join(G.top || root, rel); return sepOf(root || p) === '\\' ? p.replace(/\//g, '\\') : p; };
const byPath = (a, b) => a.path.localeCompare(b.path);

function gitMsg(r) {
  const L = ((r.err || '') + '\n' + (r.out || '')).split('\n').map(x => x.trim()).filter(x => x && !/^Command failed/.test(x));
  if (L.some(x => /nothing (added )?to commit|no changes added/i.test(x))) return 'Nothing staged. Stage some changes first.';
  if (L.some(x => /author identity unknown|tell me who you are|empty ident/i.test(x))) return 'Git does not know who you are. In the terminal run: git config --global user.name "Name" and git config --global user.email "mail"';
  if (L.some(x => /could not read Username|terminal prompts disabled|Authentication failed|Permission denied \(publickey\)/i.test(x))) return 'Authentication failed. Sign in with a credential manager or SSH key (try git push once in the terminal).';
  const f = L.find(x => /^(fatal|error):/i.test(x));
  return (f ? f.replace(/^(fatal|error):\s*/i, '') : L[0]) || 'Git command failed';
}

function parseStatus(out) {
  const parts = out.split('\0'), head = (parts.shift() || '').replace(/^## /, '');
  const R = { branch: '', upstream: '', ahead: 0, behind: 0, detached: false, staged: [], changes: [], conflicts: [] };
  let m;
  if (/^(No commits yet on|Initial commit on) /.test(head)) R.branch = head.replace(/^(No commits yet on|Initial commit on) /, '');
  else if (/^HEAD \(no branch\)/.test(head)) { R.detached = true; R.branch = 'HEAD'; }
  else if ((m = head.match(/^(.+?)(?:\.\.\.(\S+))?(?: \[(.*)\])?$/))) {
    R.branch = m[1]; R.upstream = m[2] || '';
    if (m[3]) { const a = m[3].match(/ahead (\d+)/), b = m[3].match(/behind (\d+)/); R.ahead = a ? +a[1] : 0; R.behind = b ? +b[1] : 0; }
  }
  for (let i = 0; i < parts.length; i++) {
    const e = parts[i]; if (e.length < 4) continue;
    const x = e[0], y = e[1]; let path = e.slice(3), orig = '';
    if (x === 'R' || x === 'C' || y === 'R' || y === 'C') orig = parts[++i] || '';
    const dir = path.endsWith('/'); if (dir) path = path.slice(0, -1);
    const it = { path, orig, dir };
    if (x === '!') continue;
    if (x === '?') { R.changes.push({ ...it, s: 'U' }); continue; }
    if (x === 'U' || y === 'U' || (x === 'A' && y === 'A') || (x === 'D' && y === 'D')) { R.conflicts.push({ ...it, s: '!' }); continue; }
    if (x !== ' ') R.staged.push({ ...it, s: x });
    if (y !== ' ') R.changes.push({ ...it, s: y });
  }
  R.staged.sort(byPath); R.changes.sort(byPath); R.conflicts.sort(byPath);
  return R;
}

let gitSeq = 0, gitTimer = 0;
function refreshGit() { clearTimeout(gitTimer); gitTimer = setTimeout(gRefreshNow, 120); }
async function gRefreshNow() {
  clearTimeout(gitTimer); const seq = ++gitSeq;
  if (!root) { G.state = 'nofolder'; G.top = null; return renderGit(); }
  const r = await api.git(G.top || root, ['status', '--porcelain=v1', '-b', '-z']);
  if (seq !== gitSeq) return;
  if (!r.ok) {
    G.top = null;
    if (/not a git repository/i.test(r.err)) G.state = 'norepo';
    else if (/ENOENT|not recognized|command not found/i.test(r.err)) G.state = 'nogit';
    else { G.state = 'error'; G.err = gitMsg(r); }
    return renderGit();
  }
  Object.assign(G, parseStatus(r.out), { state: 'repo' });
  const [top, lg, rm] = await Promise.all([api.git(root, ['rev-parse', '--show-toplevel']), api.git(root, ['log', '-n', '40', '--pretty=format:%h%x1f%an%x1f%ar%x1f%s']), api.git(root, ['remote'])]);
  if (seq !== gitSeq) return;
  G.top = top.ok && top.out.trim() ? top.out.trim() : root;
  G.log = lg.ok ? lg.out.split('\n').filter(Boolean).map(l => { const [h, a, t, ...m] = l.split('\x1f'); return { h, a, t, m: m.join('\x1f') }; }) : [];
  G.remotes = rm.ok ? rm.out.split('\n').map(x => x.trim()).filter(Boolean) : [];
  renderGit();
}
function setBusy(n) { G.busy = n; if (G.state === 'repo') renderGit(); }

const GEMPTY = {
  nofolder: ['fa-folder-open', 'No folder opened', 'Open a folder to start using source control.', '<button class="btn" data-cmd="File: Open Folder…">Open Folder</button>'],
  nogit: ['fa-triangle-exclamation', 'Git was not found', 'Install Git (git-scm.com), make sure it is on your PATH, then restart Arcaw.', ''],
  norepo: ['fa-code-branch', 'No repository here', 'The opened folder is not tracked by Git yet. Initialize a repository to track your changes, commit and sync.', '<button class="btn" id="g-init">Initialize Repository</button>'],
  error: ['fa-circle-exclamation', 'Source control error', '', '<button class="btn" id="g-retry">Try Again</button>']
};
function renderGit() {
  const empty = $('#g-empty'), main = $('#g-main'), total = G.staged.length + G.changes.length + G.conflicts.length;
  const badge = $('#g-badge'); badge.textContent = total > 99 ? '99+' : total; badge.classList.toggle('hidden', !(G.state === 'repo' && total));
  renderStatusBranch();
  if (G.state !== 'repo') {
    const e = GEMPTY[G.state] || GEMPTY.nofolder;
    main.classList.add('hidden'); empty.classList.remove('hidden');
    empty.innerHTML = `<i class="fa-solid ${e[0]}"></i><b>${e[1]}</b><div>${esc(G.state === 'error' ? G.err : e[2])}</div>${e[3]}`;
    const init = empty.querySelector('#g-init'); if (init) init.onclick = gInit;
    const retry = empty.querySelector('#g-retry'); if (retry) retry.onclick = gRefreshNow;
    return;
  }
  empty.classList.add('hidden'); main.classList.remove('hidden');
  $('#g-branch').innerHTML = `<i class="fa-solid fa-code-branch"></i><b>${esc(G.detached ? 'HEAD (detached)' : G.branch)}</b>${total ? '<i class="fa-solid fa-circle dirty" title="Uncommitted changes"></i>' : ''}<i class="fa-solid fa-chevron-down car"></i>`;
  const sy = $('#g-sync'), hasUp = !!G.upstream, canPub = !hasUp && G.remotes.length > 0 && !G.detached;
  sy.classList.toggle('hidden', !(hasUp || canPub)); sy.disabled = !!G.busy;
  sy.querySelector('i').className = 'fa-solid ' + (canPub ? 'fa-cloud-arrow-up' : 'fa-arrows-rotate');
  sy.querySelector('span').textContent = hasUp && (G.ahead || G.behind) ? `${G.behind}↓ ${G.ahead}↑` : '';
  sy.title = canPub ? 'Publish Branch' : `Sync Changes (pull, then push)${G.behind || G.ahead ? ` — ${G.behind} to pull, ${G.ahead} to push` : ''}`;
  sy.classList.toggle('pri', canPub || G.ahead > 0 || G.behind > 0); sy.classList.toggle('spin', G.busy === 'sync');
  $('#g-fetch').classList.toggle('spin', G.busy === 'fetch'); $('#g-fetch').classList.toggle('hidden', !G.remotes.length);
  updateGitControls();

  const list = $('#g-list'), keep = list.scrollTop; list.innerHTML = '';
  if (G.conflicts.length) { list.append(gSection('conflicts', 'Merge Changes', G.conflicts.length, [['fa-plus', 'Stage All (mark resolved)', () => gStage(G.conflicts.map(i => i.path))]])); if (G.open.conflicts) G.conflicts.forEach(i => list.append(gRow(i, 'conflicts'))); }
  if (G.staged.length) { list.append(gSection('staged', 'Staged Changes', G.staged.length, [['fa-minus', 'Unstage All Changes', () => gUnstage(null)]])); if (G.open.staged) G.staged.forEach(i => list.append(gRow(i, 'staged'))); }
  if (G.changes.length) { list.append(gSection('changes', 'Changes', G.changes.length, [['fa-rotate-left', 'Discard All Changes', () => gDiscard(G.changes, true)], ['fa-plus', 'Stage All Changes', () => gStage(null)]])); if (G.open.changes) G.changes.forEach(i => list.append(gRow(i, 'changes'))); }
  if (G.log.length) {
    list.append(gSection('history', 'Commits', G.log.length, []));
    if (G.open.history) for (const c of G.log) {
      const d = el('div', 'gh', `<div class="gm">${esc(c.m)}</div><div class="gi"><code>${esc(c.h)}</code> • ${esc(c.a)} • ${esc(c.t)}</div>`);
      d.title = c.m + '\n' + c.a + ' · ' + c.t + ' · click to copy hash'; d.onclick = () => navigator.clipboard.writeText(c.h).then(() => toast('Copied ' + c.h, 'ok'), () => { }); list.append(d);
    }
  }
  list.scrollTop = keep;
}
function renderStatusBranch() {
  const b = $('#st-branch'); if (!b) return;
  if (G.state !== 'repo') { b.innerHTML = '<i class="fa-solid fa-code-branch"></i> –'; return; }
  const dirty = G.staged.length + G.changes.length + G.conflicts.length > 0;
  b.innerHTML = `<i class="fa-solid fa-code-branch"></i> ${esc(G.detached ? 'HEAD' : G.branch)}${dirty ? '*' : ''}${G.behind || G.ahead ? ` <span>${G.behind}↓ ${G.ahead}↑</span>` : ''}`;
}
function updateGitControls() {
  const ta = $('#g-msg'), m = ta.value.trim(), first = ta.value.split('\n')[0].length;
  $('#g-commit').disabled = !!G.busy || !m || G.state !== 'repo' || (!G.staged.length && !G.changes.length) || G.conflicts.length > 0;
  $('#g-more').disabled = !!G.busy;
  const c = $('#g-count');
  c.textContent = ta.value ? `${first} / 72` : G.staged.length ? `${G.staged.length} staged` : '';
  c.classList.toggle('warn', first > 72);
}
const gAuto = () => { const t = $('#g-msg'); t.style.height = 'auto'; t.style.height = Math.min(150, t.scrollHeight + 2) + 'px'; updateGitControls(); };

function gSection(key, title, count, actions) {
  const h = el('div', 'gsec', `<i class="fa-solid fa-chevron-${G.open[key] ? 'down' : 'right'} chev"></i><span class="gt">${title}</span>`), ga = el('div', 'ga');
  for (const [ic, tip, fn] of actions) { const b = el('button', '', `<i class="fa-solid ${ic}"></i>`); b.title = tip; b.onclick = e => { e.stopPropagation(); fn(); }; ga.append(b); }
  h.append(ga, el('span', 'pill', String(count))); h.onclick = () => { G.open[key] = !G.open[key]; renderGit(); }; return h;
}
function gRow(it, kind) {
  const name = base(it.path), dir = it.path.includes('/') ? it.path.slice(0, it.path.lastIndexOf('/')) : '';
  const row = el('div', 'gr' + (it.s === 'D' ? ' del' : ''), `<i class="${iconFor({ name, dir: it.dir })}"></i><span class="gl"><span class="gn">${esc(name)}</span><span class="gd">${esc(dir)}</span></span><span class="ga"></span><span class="gs" style="color:${GCOL[it.s]}">${it.s}</span>`);
  row.title = (it.orig ? it.orig + ' → ' : '') + it.path + ' — ' + GNAME[it.s];
  const ga = row.querySelector('.ga'), act = (ic, tip, fn) => { const b = el('button', '', `<i class="fa-solid ${ic}"></i>`); b.title = tip; b.onclick = e => { e.stopPropagation(); fn(); }; ga.append(b); };
  const canOpen = !it.dir && it.s !== 'D';
  if (canOpen) act('fa-file-lines', 'Open File', () => openFile(gitAbs(it.path)));
  if (kind === 'staged') act('fa-minus', 'Unstage Changes', () => gUnstage([it]));
  else { if (kind === 'changes') act('fa-rotate-left', it.s === 'U' ? 'Delete Untracked File' : 'Discard Changes', () => gDiscard([it])); act('fa-plus', kind === 'conflicts' ? 'Mark as Resolved' : 'Stage Changes', () => gStage([it.path])); }
  row.onclick = () => { if (it.dir) return; if (kind === 'conflicts' || it.s === 'U') { if (canOpen) openFile(gitAbs(it.path)); } else gShowDiff(it, kind === 'staged'); };
  row.ondblclick = () => { if (canOpen) openFile(gitAbs(it.path)); };
  return row;
}

async function gRun(args, fail) { const r = await gitRun(args); if (!r.ok) toast(fail || gitMsg(r), 'err'); return r; }
async function gStage(paths) { const r = await gRun(paths ? ['add', '-A', '--', ...paths] : ['add', '-A']); if (r.ok) await gRefreshNow(); }
async function gUnstage(items) {
  const hasHead = G.log.length > 0; let r;
  if (items) { const paths = items.flatMap(i => i.orig ? [i.path, i.orig] : [i.path]); r = await gRun(hasHead ? ['reset', '-q', 'HEAD', '--', ...paths] : ['rm', '--cached', '-r', '-q', '--', ...paths]); }
  else r = await gRun(hasHead ? ['reset', '-q', 'HEAD'] : ['rm', '--cached', '-r', '-q', '.']);
  if (r.ok) await gRefreshNow();
}
async function gDiscard(items, all) {
  const tracked = items.filter(i => i.s !== 'U'), untracked = items.filter(i => i.s === 'U');
  const msg = items.length === 1 ? (untracked.length ? `Move "${base(items[0].path)}" to the Recycle Bin?` : `Discard changes in "${base(items[0].path)}"? This cannot be undone.`) : `Discard ${items.length} changes? Tracked files are restored (cannot be undone), untracked files go to the Recycle Bin.`;
  if ((await api.dlg_confirm(msg, ['Discard', 'Cancel'])) !== 0) return;
  if (tracked.length) await gRun(['restore', '--', ...(all && tracked.length === items.length ? ['.'] : tracked.map(i => i.path))]);
  for (const u of untracked) {
    const p = gitAbs(u.path);
    for (const t of order.filter(x => x === p || x.startsWith(p + sepOf(p)))) { if (files.get(t)) files.get(t).dirty = false; await closeTab(t); }
    try { await api.fs_delete(p); } catch (e) { toast(clean(e), 'err'); }
  }
  await syncOpenFiles(); await gRefreshNow(); refreshTree(); indexFiles();
}
async function syncOpenFiles() {
  for (const [p, f] of files) {
    if (f.dirty) continue;
    try { const t = await api.fs_read(p); if (t !== f.model.getValue()) { f.model.setValue(t); clearTimeout(f.t); f.saved = f.model.getAlternativeVersionId(); f.dirty = false; } } catch { /* removed or unreadable */ }
  }
  renderTabs(); updateStatus();
}

async function gCommit({ push = false, amend = false } = {}) {
  if (G.busy || G.state !== 'repo') return;
  const ta = $('#g-msg'), m = ta.value.trim();
  if (!m && !amend) { toast('Enter a commit message first', 'err'); ta.focus(); return; }
  if (G.conflicts.length) return toast('Resolve merge conflicts before committing', 'err');
  if (!G.staged.length && !amend) {
    if (!G.changes.length) return toast('Nothing to commit', 'err');
    if ((await api.dlg_confirm('There are no staged changes. Stage all changes and commit?', ['Stage All & Commit', 'Cancel'])) !== 0) return;
    if (!(await gRun(['add', '-A'])).ok) return gRefreshNow();
  }
  setBusy('commit');
  const r = await gitRun(['commit', ...(amend ? ['--amend'] : []), ...(m ? ['-m', m] : ['--no-edit'])]);
  if (!r.ok) { toast(gitMsg(r), 'err'); setBusy(''); return gRefreshNow(); }
  ta.value = ''; gAuto(); toast(amend ? 'Last commit amended' : 'Commit successful', 'ok');
  await gRefreshNow();
  setBusy(''); if (push) gSync(true);
}
async function gSync(pushOnly) {
  if (G.busy || G.state !== 'repo') return;
  const hasUp = !!G.upstream, remote = G.remotes.includes('origin') ? 'origin' : G.remotes[0];
  if (!hasUp && !remote) return toast('This repository has no remote. Add one in the terminal: git remote add origin <url>', 'err');
  setBusy('sync');
  try {
    if (!hasUp) { const r = await gitRun(['push', '-u', remote, G.branch]); toast(r.ok ? `Published "${G.branch}" to ${remote}` : gitMsg(r), r.ok ? 'ok' : 'err'); return; }
    if (!pushOnly) { const p = await gitRun(['pull', '--no-rebase', '--no-edit']); if (!p.ok) return toast(gitMsg(p), 'err'); await syncOpenFiles(); }
    const st = await gitRun(['status', '--porcelain=v1', '-b']), a = /ahead (\d+)/.exec(st.out || '');
    if (a) { const r = await gitRun(['push']); if (!r.ok) return toast(gitMsg(r), 'err'); toast('Synced: pushed ' + a[1] + ' commit(s)', 'ok'); } else toast('Up to date', 'ok');
  } finally { G.busy = ''; await gRefreshNow(); refreshTree(); indexFiles(); }
}
async function gFetch() {
  if (G.busy || G.state !== 'repo' || !G.remotes.length) return;
  setBusy('fetch'); const r = await gitRun(['fetch', '--all', '--prune']); if (!r.ok) toast(gitMsg(r), 'err'); G.busy = ''; await gRefreshNow();
}
async function gInit() {
  const r = await api.git(root, ['init']); if (!r.ok) return toast(gitMsg(r), 'err');
  toast('Repository initialized', 'ok'); await gRefreshNow();
}
async function gCheckout(n) {
  if (n === G.branch) return;
  const r = await gRun(['checkout', n]); if (!r.ok) return;
  await syncOpenFiles(); await gRefreshNow(); refreshTree(); indexFiles(); toast('Switched to ' + n, 'ok');
}
async function gNewBranch() {
  const n = await ask('New branch name'); if (!n) return;
  const r = await gRun(['checkout', '-b', n.replace(/\s+/g, '-')]); if (r.ok) { await gRefreshNow(); toast('Created branch ' + n.replace(/\s+/g, '-'), 'ok'); }
}
async function gBranchMenu() {
  if (G.state !== 'repo') return setView('git');
  const [l, rm] = await Promise.all([gitRun(['branch', '--format=%(refname:short)', '--sort=-committerdate']), gitRun(['branch', '-r', '--format=%(refname:short)'])]);
  const local = l.ok ? l.out.split('\n').map(x => x.trim()).filter(x => x && !x.startsWith('(')) : [];
  const remote = rm.ok ? rm.out.split('\n').map(x => x.trim()).filter(x => x && !/\/HEAD$/.test(x) && x.includes('/')).map(x => x.slice(x.indexOf('/') + 1)).filter((x, i, a) => !local.includes(x) && a.indexOf(x) === i) : [];
  palette('', [{ label: '+ Create new branch…', hint: '', run: gNewBranch }, ...local.map(n => ({ label: n, hint: n === G.branch ? 'current' : 'local', run: () => gCheckout(n) })), ...remote.map(n => ({ label: n, hint: 'remote', run: () => gCheckout(n) }))]);
}
function gMoreMenu(e) {
  const r = e.currentTarget.getBoundingClientRect();
  popup(r.right - 190, r.bottom + 2, [['Commit', () => gCommit()], ['Commit & Push', () => gCommit({ push: true })], ['Commit (Amend Last)', () => gCommit({ amend: true })], '-', ['Stage All Changes', () => gStage(null)], ['Unstage All Changes', () => gUnstage(null)], '-', ['Undo Last Commit (keep changes)', async () => { if ((await api.dlg_confirm('Undo the last commit and keep its changes staged?', ['Undo Commit', 'Cancel'])) === 0) { const x = await gRun(['reset', '--soft', 'HEAD~1']); if (x.ok) gRefreshNow(); } }]]);
}

/* diff viewer (Monaco diff editor in a large dialog) */
let diffView = null;
function disposeDiff() { if (!diffView) return; const d = diffView; diffView = null; try { d.ed.dispose(); d.models.forEach(m => m.dispose()); } catch { /* already gone */ } }
async function gShowDiff(it, staged) {
  if (!window.monaco || !monaco.editor) return toast('Editor is still loading…');
  const show = async spec => { const r = await gitRun(['show', spec]); return r.ok ? r.out : ''; };
  const workText = async p => { const f = files.get(p); if (f) return f.model.getValue(); try { return await api.fs_read(p); } catch (e) { toast(clean(e), 'err'); return null; } };
  let a, b; const o = it.orig || it.path;
  if (staged) { a = it.s === 'A' || it.s === 'C' ? '' : await show('HEAD:' + o); b = it.s === 'D' ? '' : await show(':' + it.path); }
  else { a = await show(':' + o); b = it.s === 'D' ? '' : await workText(gitAbs(it.path)); }
  if (b === null) return;
  if (a.includes('\0') || b.includes('\0')) return toast('Binary files cannot be compared', 'err');
  let side = innerWidth > 1100;
  const box = modal(`<div class="dv-h"><i class="${iconFor({ name: base(it.path) })}"></i><b>${esc(it.path)}</b><small>${staged ? 'Staged (HEAD ↔ Index)' : 'Working Tree (Index ↔ File)'}</small><span class="sp"></span><button id="dv-mode"></button>${it.s === 'D' ? '' : '<button id="dv-open">Open File</button>'}<button id="dv-x" title="Close"><i class="fa-solid fa-xmark"></i></button></div><div class="dv-b" id="dv-b"></div>`, 'wide');
  const uri = k => monaco.Uri.parse('arcaw-diff:///' + k + '/' + encodeURI(it.path));
  [uri('a'), uri('b')].forEach(u => { const m = monaco.editor.getModel(u); if (m) m.dispose(); });
  const mo = monaco.editor.createModel(a, undefined, uri('a')), mm = monaco.editor.createModel(b, undefined, uri('b'));
  const ed = monaco.editor.createDiffEditor(box.querySelector('#dv-b'), { readOnly: true, originalEditable: false, automaticLayout: true, renderSideBySide: side, enableSplitViewResizing: true, minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: S.fontSize, fontFamily: S.fontFamily, padding: { top: 6 } });
  ed.setModel({ original: mo, modified: mm }); diffView = { ed, models: [mo, mm] };
  const mode = box.querySelector('#dv-mode'), setMode = () => { mode.textContent = side ? 'Inline view' : 'Side by side'; ed.updateOptions({ renderSideBySide: side }); };
  mode.onclick = () => { side = !side; setMode(); }; setMode();
  box.querySelector('#dv-x').onclick = closeModal;
  const op = box.querySelector('#dv-open'); if (op) op.onclick = () => { closeModal(); openFile(gitAbs(it.path)); };
}

/* ---------- Terminal: real PTY (node-pty) rendered by xterm.js, like VS Code ---------- */
const terms = []; const byId = new Map();
let curTerm = null, termSeq = 0, HOME = '', IS_WIN = false, WIN_BUILD = 0, panelMax = false, SHELLS = [];
const TERM_PASS = new Set(['Ctrl+`', 'Ctrl+Shift+~', 'Ctrl+Shift+`', 'Ctrl+Shift+P', 'Ctrl+P', 'Ctrl+B', 'Ctrl+,', 'Ctrl+Shift+E', 'Ctrl+Shift+F', 'Ctrl+Shift+G']);
const ANSI_DARK = { black: '#3f4451', red: '#e06c75', green: '#98c379', yellow: '#e5c07b', blue: '#61afef', magenta: '#c678dd', cyan: '#56b6c2', white: '#abb2bf', brightBlack: '#5c6370', brightRed: '#ff7b86', brightGreen: '#b1e18b', brightYellow: '#f0d197', brightBlue: '#7ec1ff', brightMagenta: '#d98bf0', brightCyan: '#6fd6e3', brightWhite: '#ffffff' };
const ANSI_LIGHT = { black: '#383a42', red: '#e45649', green: '#50a14f', yellow: '#c18401', blue: '#4078f2', magenta: '#a626a4', cyan: '#0184bc', white: '#a0a1a7', brightBlack: '#4f525e', brightRed: '#e06c75', brightGreen: '#50a14f', brightYellow: '#c18401', brightBlue: '#4078f2', brightMagenta: '#a626a4', brightCyan: '#0184bc', brightWhite: '#000000' };
const termTheme = () => { const t = THEMES[S.theme] || THEMES['one-dark']; return { ...(t.b === 'vs' ? ANSI_LIGHT : ANSI_DARK), background: t.bg, foreground: t.text, cursor: t.accent, cursorAccent: t.bg, selectionBackground: t.sel }; };
const shellName = s => (s || 'shell').replace(/\.exe$/i, '').replace(/^.*[\\/]/, '');
const panelHidden = () => $('#panel').classList.contains('hidden');
const panelLimit = () => Math.max(80, $('#main').clientHeight - 5); // may reach the very top; the tab bar shrinks away smoothly (flex-shrink)
function applyPanel() { $('#panel').style.height = panelMax ? '' : clamp(panelH, 80, panelLimit()) + 'px'; }
function setPanelMax(on) {
  panelMax = !!on; $('#main').classList.toggle('pmax', panelMax); applyPanel();
  $('#t-max').innerHTML = `<i class="fa-solid fa-${panelMax ? 'compress' : 'expand'}"></i>`; $('#t-max').title = panelMax ? 'Restore panel size' : 'Maximize panel';
}
function showPanel(on) {
  if (!on) setPanelMax(false); else applyPanel();
  $('#panel').classList.toggle('hidden', !on); $('#rz-panel').classList.toggle('hidden', !on);
  if (on && curTerm) selectTerm(curTerm, true);
}
function toggleTerm(force) { const on = force ?? panelHidden(); if (on && !terms.length) newTerm(); else showPanel(on); }
const fitTerm = t => {
  if (!t || !t.opened || !t.fit || panelHidden()) return;
  try { const d = t.fit.proposeDimensions(); if (d && d.cols > 0 && d.rows > 0 && (d.cols !== t.x.cols || d.rows !== t.x.rows)) t.x.resize(d.cols, d.rows); } catch { /* not visible yet */ }
};
const fitCur = () => fitTerm(curTerm);

function newTerm(o = {}) {
  const shell = o.shell || (SHELLS[0] && SHELLS[0][0]) || undefined;
  const t = { id: ++termSeq, shell, name: o.name || shellName(shell), cwd: o.cwd || root || HOME || '.', opened: false, dead: false, killed: false };
  t.view = el('div', 'tv hidden'); t.host = el('div', 'xh'); t.view.append(t.host); $('#tviews').append(t.view);
  t.view.addEventListener('contextmenu', e => {
    e.preventDefault(); const x = t.x;
    popup(e.clientX, e.clientY, [['Copy', () => { if (x && x.hasSelection()) navigator.clipboard.writeText(x.getSelection()); }], ['Paste', async () => { try { x.paste(await navigator.clipboard.readText()); } catch { /* denied */ } }], ['Select All', () => x && x.selectAll()], '-', ['Clear', () => clearTerm(t)], ['Rename…', () => renameTerm(t)], ['Kill Terminal', () => closeTerm(t)]]);
  });
  terms.push(t); byId.set(t.id, t);
  if (!o.silent) showPanel(true);
  selectTerm(t, !o.silent); persist(); return t;
}
async function ensureOpen(t) {
  if (t.opened) return; t.opened = true;
  const x = t.x = new Terminal({ fontFamily: S.fontFamily, fontSize: S.termFontSize, cursorStyle: S.termCursor, cursorBlink: S.termBlink, scrollback: S.scrollback, allowProposedApi: true, macOptionIsMeta: true, theme: termTheme(), ...(IS_WIN ? { windowsPty: { backend: 'conpty', buildNumber: WIN_BUILD || undefined } } : {}) });
  t.fit = new FitAddon.FitAddon(); x.loadAddon(t.fit); x.loadAddon(new WebLinksAddon.WebLinksAddon());
  x.open(t.host);
  if (S.gpu) { try { const w = new WebglAddon.WebglAddon(); w.onContextLoss(() => w.dispose()); x.loadAddon(w); } catch { /* falls back to the DOM renderer */ } }
  fitTerm(t);
  x.attachCustomKeyEventHandler(e => {
    if (e.type !== 'keydown') return true;
    if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'c' && (e.shiftKey || x.hasSelection())) { if (x.hasSelection()) navigator.clipboard.writeText(x.getSelection()); return false; }
    return true;
  });
  x.onData(d => { if (t.dead) { if (d === '\r') spawnPty(t); return; } api.pty_write(t.id, d); });
  // the pty only ever sees the FINAL size: resizing it on every drag step makes Windows ConPTY repaint (duplicated prompts)
  x.onResize(({ cols, rows }) => { if (t.dead) return; clearTimeout(t.rt); t.rt = setTimeout(() => { if (!t.killed && !t.dead) api.pty_resize(t.id, cols, rows); }, 120); });
  x.onSelectionChange(() => { if (S.copyOnSelect && x.hasSelection()) navigator.clipboard.writeText(x.getSelection()).catch(() => { }); });
  await spawnPty(t);
}
async function spawnPty(t) {
  t.dead = false; if (t.x.buffer.active.length > 1) t.x.write('\r\n');
  let r; try { r = await api.pty_create(t.id, { file: t.shell, cwd: t.cwd, cols: t.x.cols, rows: t.x.rows }); } catch (e) { r = { error: clean(e) }; }
  if (r && r.error) { t.dead = true; t.x.write('\x1b[31m' + r.error.replace(/\n/g, '\r\n') + '\x1b[0m\r\n'); }
}
function selectTerm(t, focus = true) {
  curTerm = t; terms.forEach(x => x.view.classList.toggle('hidden', x !== t)); renderTList();
  if (!panelHidden()) ensureOpen(t).then(() => requestAnimationFrame(() => { fitTerm(t); try { if (t.x.clearTextureAtlas) t.x.clearTextureAtlas(); t.x.refresh(0, t.x.rows - 1); } catch { /* ignore */ } if (focus) t.x.focus(); }));
}
function renderTList() {
  const box = $('#tlist'); box.innerHTML = '';
  for (const t of terms) {
    const d = el('div', 'ti' + (t === curTerm ? ' on' : ''), `<i class="fa-solid fa-terminal"></i><span>${esc(t.name)}</span><i class="fa-solid fa-xmark x" title="Kill Terminal"></i>`);
    d.title = t.name + ' — ' + t.cwd;
    d.onclick = () => selectTerm(t); d.ondblclick = () => renameTerm(t);
    d.querySelector('.x').onclick = e => { e.stopPropagation(); closeTerm(t); };
    d.oncontextmenu = e => { e.preventDefault(); popup(e.clientX, e.clientY, [['Rename…', () => renameTerm(t)], ['Clear', () => clearTerm(t)], '-', ['New Terminal', () => newTerm()], ['Kill Terminal', () => closeTerm(t)], ['Kill All Terminals', closeAllTerms]]); };
    box.append(d);
  }
}
async function renameTerm(t) { const n = await ask('Rename terminal', t.name); if (n) { t.name = n; renderTList(); persist(); } if (t.x) t.x.focus(); }
function clearTerm(t) { if (t.x) { t.x.clear(); t.x.focus(); } }
function closeTerm(t) {
  const i = terms.indexOf(t); if (i < 0) return;
  t.killed = true; clearTimeout(t.rt); api.pty_kill(t.id); byId.delete(t.id);
  try { if (t.x) t.x.dispose(); } catch { /* already disposed */ }
  t.view.remove(); terms.splice(i, 1);
  if (curTerm === t) { curTerm = null; const n = terms[Math.min(i, terms.length - 1)]; if (n) selectTerm(n); else { renderTList(); showPanel(false); if (editor) editor.focus(); } } else renderTList();
  persist();
}
function closeAllTerms() { [...terms].forEach(closeTerm); }
function stepTerm(d) { if (terms.length) selectTerm(terms[(terms.indexOf(curTerm) + d + terms.length) % terms.length]); }
function applyTermOptions() {
  for (const t of terms) if (t.x) { const o = t.x.options; o.theme = termTheme(); o.fontFamily = S.fontFamily; o.fontSize = S.termFontSize; o.cursorStyle = S.termCursor; o.cursorBlink = S.termBlink; o.scrollback = S.scrollback; }
  fitCur();
}
api.on('pty:data', (id, d) => { const t = byId.get(id); if (t && t.x) t.x.write(d); });
api.on('pty:exit', (id, code) => {
  const t = byId.get(id); if (!t) return;
  if (code === 0) { closeTerm(t); return; }
  t.dead = true; if (t.x) t.x.write(`\r\n\x1b[90m[Process exited with code ${code}. Press Enter to restart]\x1b[0m\r\n`);
});
function initTermUI() {
  const below = b => { const r = b.getBoundingClientRect(); return [r.left, r.bottom]; };
  $('#t-new').onclick = () => newTerm();
  $('#t-caret').onclick = e => popup(...below(e.currentTarget), SHELLS.map(([f, n]) => ['New ' + n, () => newTerm({ shell: f, name: n })]));
  $('#t-more').onclick = e => popup(...below(e.currentTarget), [['Rename Terminal…', () => curTerm && renameTerm(curTerm)], ['Clear Terminal', () => curTerm && clearTerm(curTerm)], '-', ['Next Terminal', () => stepTerm(1)], ['Previous Terminal', () => stepTerm(-1)], '-', ['Kill Terminal', () => curTerm && closeTerm(curTerm)], ['Kill All Terminals', closeAllTerms]]);
  $('#t-max').onclick = () => setPanelMax(!panelMax);
  $('#t-close').onclick = () => showPanel(false);
  let raf = 0; new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fitCur); }).observe($('#tviews'));
}

/* ---------- Updates ---------- */
let updManual = false, updToldReady = false;
async function confirmQuit() {
  const dirty = order.filter(p => files.get(p) && files.get(p).dirty);
  if (dirty.length) { const r = await api.dlg_confirm(`${dirty.length} file(s) have unsaved changes.`, ['Save All', 'Discard', 'Cancel']); if (r === 2) return false; if (r === 0) await saveAll(); }
  return true;
}
function onUpdate(u, quiet) {
  const b = $('#st-update'); b.classList.toggle('hidden', !(u.state === 'downloading' || u.state === 'ready')); b.classList.toggle('ready', u.state === 'ready');
  if (u.state === 'downloading') b.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Updating… ${u.percent || 0}%`;
  if (u.state === 'ready') b.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Restart to update${u.version ? ' (v' + esc(u.version) + ')' : ''}`;
  b.title = u.state === 'ready' ? 'Install the downloaded update and restart Arcaw' : 'Downloading the latest version in the background';
  if (quiet) return;
  if (u.state === 'ready' && !updToldReady) { updToldReady = true; toast(`Update v${u.version} is ready. Click "Restart to update" in the status bar.`, 'ok'); }
  if (!updManual) return;
  if (u.state === 'none') { updManual = false; toast('You are on the latest version', 'ok'); }
  else if (u.state === 'error') { updManual = false; toast('Update check failed: ' + (u.message || 'unknown error'), 'err'); }
  else if (u.state === 'downloading' && !u.percent) toast(`Downloading v${u.version}…`);
  else if (u.state === 'ready') updManual = false;
}
async function checkForUpdates() {
  updManual = true; const r = await api.update_check();
  if (r && r.state === 'unsupported') { updManual = false; toast('Updates work only in the installed version of Arcaw (not portable or dev runs).', 'err'); }
}
async function installUpdate() { if (await confirmQuit()) { await api.state_set(snapshot()); api.update_install(); } }

/* ---------- Commands, menus, palette ---------- */
const act = id => () => editor && editor.getAction(id).run();
const CMDS = [
  ['File: New File', 'Ctrl+N', () => newItem(false)], ['File: New Folder', null, () => newItem(true)],
  ['File: Open Folder…', 'Ctrl+O', openFolder], ['File: Open File…', 'Ctrl+Shift+O', openFiles],
  ['File: Save', 'Ctrl+S', () => save()], ['File: Save All', 'Ctrl+Alt+S', saveAll], ['File: Close Tab', 'Ctrl+W', () => active && closeTab(active)],
  ['File: Exit', null, () => api.win_close()],
  ['Edit: Undo', 'Ctrl+Z', act('undo')], ['Edit: Redo', 'Ctrl+Y', act('redo')], ['Edit: Find', 'Ctrl+F', act('actions.find')], ['Edit: Replace', 'Ctrl+H', act('editor.action.startFindReplace')],
  ['Edit: Toggle Comment', 'Ctrl+/', act('editor.action.commentLine')], ['Edit: Format Document', 'Alt+Shift+F', act('editor.action.formatDocument')],
  ['Go: Quick Open File', 'Ctrl+P', () => palette('')], ['Go: Go to Line…', 'Ctrl+G', act('editor.action.gotoLine')],
  ['View: Command Palette', 'Ctrl+Shift+P', () => palette('>')], ['View: Toggle Sidebar', 'Ctrl+B', () => { $('#side').classList.toggle('hidden'); $('#rz-side').classList.toggle('hidden'); }],
  ['View: Toggle Terminal', 'Ctrl+`', () => toggleTerm()],
  ['Terminal: New Terminal', 'Ctrl+Shift+`', () => newTerm()], ['Terminal: Rename Terminal', null, () => curTerm && renameTerm(curTerm)], ['Terminal: Clear', null, () => curTerm && clearTerm(curTerm)], ['Terminal: Kill Terminal', null, () => curTerm && closeTerm(curTerm)], ['Terminal: Next Terminal', null, () => stepTerm(1)], ['Terminal: Previous Terminal', null, () => stepTerm(-1)],
  ['View: Explorer', 'Ctrl+Shift+E', () => setView('explorer')], ['View: Search', 'Ctrl+Shift+F', () => { setView('search'); $('#s-in').focus(); }], ['View: Source Control', 'Ctrl+Shift+G', () => setView('git')],
  ['File: Copy Path', 'Alt+Shift+C', () => copyPaths(contextPaths(), false)], ['File: Copy Relative Path', 'Ctrl+Alt+Shift+C', () => copyPaths(contextPaths(), true)],
  ['Explorer: Cut', 'Ctrl+X', () => cutSel([...sels]), 'explorer'], ['Explorer: Copy', 'Ctrl+C', () => copySel([...sels]), 'explorer'], ['Explorer: Paste', 'Ctrl+V', () => pasteInto(), 'explorer'],
  ['Explorer: Rename', 'F2', () => { if (sels.size === 1) renameItem({ name: base(selected), path: selected, dir: isDirPath(selected) }); }, 'explorer'], ['Explorer: Delete', 'Delete', () => deleteItems([...sels]), 'explorer'],
  ['Explorer: Select All', 'Ctrl+A', () => { sels = new Set(visiblePaths()); markTree(); }, 'explorer'],
  ['Go: Next Tab', 'Ctrl+Tab', () => stepTab(1)], ['Go: Previous Tab', 'Ctrl+Shift+Tab', () => stepTab(-1)],
  ['View: Reset Zoom', 'Ctrl+0', () => { S.fontSize = DEF.fontSize; applySettings(); }], ['View: Toggle Full Screen', 'F11', () => api.win_fullscreen()],
  ['View: Zoom In', 'Ctrl+=', () => { S.fontSize = Math.min(32, S.fontSize + 1); applySettings(); }], ['View: Zoom Out', 'Ctrl+-', () => { S.fontSize = Math.max(10, S.fontSize - 1); applySettings(); }],
  ['Preferences: Settings', 'Ctrl+,', openSettings], ['Preferences: Color Theme', null, pickTheme],
  ['Help: Keyboard Shortcuts', null, showShortcuts], ['Help: About', null, showAbout], ['Help: Welcome', null, openWelcome], ['Help: Check for Updates…', null, checkForUpdates],
  ['Git: Sync Changes', null, () => gSync()], ['Git: Fetch', null, () => gFetch()], ['Git: Switch Branch…', null, () => gBranchMenu()], ['Git: Refresh', null, () => gRefreshNow()]
];
const byLabel = Object.fromEntries(CMDS.map(c => [c[0], c]));
const MENUS = { File: ['File: New File', 'File: New Folder', '-', 'File: Open Folder…', 'File: Open File…', '-', 'File: Save', 'File: Save All', 'File: Close Tab', '-', 'File: Copy Path', 'File: Copy Relative Path', '-', 'Preferences: Settings', 'File: Exit'], Edit: ['Edit: Undo', 'Edit: Redo', '-', 'Edit: Find', 'Edit: Replace', 'Edit: Toggle Comment', 'Edit: Format Document'], View: ['View: Command Palette', 'Go: Quick Open File', 'Go: Go to Line…', '-', 'View: Explorer', 'View: Search', 'View: Source Control', '-', 'View: Toggle Sidebar', 'View: Toggle Terminal', '-', 'View: Zoom In', 'View: Zoom Out', 'View: Reset Zoom', 'View: Toggle Full Screen', 'Go: Next Tab', 'Go: Previous Tab', 'Preferences: Color Theme'], Terminal: ['Terminal: New Terminal', 'Terminal: Rename Terminal', 'Terminal: Clear', 'Terminal: Kill Terminal', '-', 'Terminal: Next Terminal', 'Terminal: Previous Terminal', '-', 'View: Toggle Terminal'], Help: ['Help: Keyboard Shortcuts', 'Help: Welcome', '-', 'Help: Check for Updates…', 'Help: About'] };
function buildMenus() {
  const nav = $('#menus');
  for (const [name, items] of Object.entries(MENUS)) {
    const mb = el('div', 'mb', `<button>${name}</button>`), dd = el('div', 'dd');
    for (const l of items) { if (l === '-') { dd.append(el('hr')); continue; } const c = byLabel[l], b = el('button', '', `<span>${esc(l.split(': ')[1])}</span><small>${c[1] || ''}</small>`); b.onclick = () => { mb.classList.remove('open'); c[2](); }; dd.append(b); }
    mb.append(dd); mb.firstChild.onclick = () => { const o = mb.classList.contains('open'); document.querySelectorAll('.mb.open').forEach(m => m.classList.remove('open')); mb.classList.toggle('open', !o); };
    mb.firstChild.onmouseenter = () => { if (document.querySelector('.mb.open')) { document.querySelectorAll('.mb.open').forEach(m => m.classList.remove('open')); mb.classList.add('open'); } };
    nav.append(mb);
  }
}
function palette(prefix, custom) {
  const b = modal('<div class="pal"><input id="pi" spellcheck="false"><div id="pl" style="max-height:50vh;overflow:auto"></div></div>'), inp = b.querySelector('#pi'), list = b.querySelector('#pl'); let items = [], idx = 0;
  const render = () => {
    const raw = inp.value, cmdMode = raw.startsWith('>'), q = raw.replace(/^>/, '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    const src = custom ? custom : cmdMode ? CMDS.map(c => ({ label: c[0], hint: c[1] || '', run: c[2] })) : fileIndex.map(p => ({ label: base(p), hint: root ? p.slice(root.length + 1) : p, run: () => openFile(p) }));
    items = src.filter(i => q.every(w => (i.label + ' ' + i.hint).toLowerCase().includes(w))).slice(0, 60); idx = Math.min(idx, Math.max(0, items.length - 1));
    list.innerHTML = ''; items.forEach((it, n) => { const d = el('div', 'pi' + (n === idx ? ' on' : ''), `<span>${esc(it.label)}</span><small>${esc(it.hint)}</small>`); d.onclick = () => run(n); list.append(d); });
    const on = list.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  };
  const run = n => { const it = items[n]; closeModal(); if (it) setTimeout(it.run, 0); };
  inp.value = prefix; inp.focus(); inp.oninput = () => { idx = 0; render(); };
  inp.onkeydown = e => { if (e.key === 'ArrowDown') { idx = Math.min(idx + 1, items.length - 1); render(); e.preventDefault(); } else if (e.key === 'ArrowUp') { idx = Math.max(idx - 1, 0); render(); e.preventDefault(); } else if (e.key === 'Enter') run(idx); else if (e.key === 'Escape') closeModal(); };
  render();
}
function pickTheme() { palette('', Object.entries(THEMES).map(([k, v]) => ({ label: v.n, hint: k === S.theme ? 'current' : '', run: () => { S.theme = k; applySettings(); } }))); }
function showShortcuts() { modal(`<div class="mh">Keyboard Shortcuts<button onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="mbody">${CMDS.filter(c => c[1]).map(c => `<div class="set"><span>${esc(c[0])}</span><small>${c[1]}</small></div>`).join('')}</div>`); }
async function showAbout() { let v = '1.0.0'; try { v = (await api.app_info()).version || v; } catch { /* keep default */ } modal(`<div class="mh">About<button onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="mbody"><div><b>Arcaw ${esc(v)}</b></div><div>Electron · Monaco Editor 0.52</div></div>`); }

const KEYS = {}, EK = {};
CMDS.forEach(c => { if (c[1]) (c[3] === 'explorer' ? EK : KEYS)[c[1]] = c[2]; });
KEYS['Ctrl+Shift+~'] = KEYS['Ctrl+Shift+`']; KEYS['Ctrl+J'] = KEYS['Ctrl+`'];                       // Ctrl+J: terminal on layouts where ` is awkward
['Ctrl+Shift+=', 'Ctrl+Shift++', 'Ctrl++'].forEach(k => { KEYS[k] = KEYS['Ctrl+=']; });               // zoom in needs Shift on most layouts
['Ctrl+Shift+_'].forEach(k => { KEYS[k] = KEYS['Ctrl+-']; });
TERM_PASS.add('Ctrl+J');['Ctrl+Tab', 'Ctrl+Shift+Tab', 'Ctrl+0', 'Ctrl+=', 'Ctrl+-', 'Ctrl+Shift+=', 'Ctrl+Shift++', 'Ctrl++', 'F11', 'Alt+Shift+C', 'Ctrl+Alt+Shift+C'].forEach(k => TERM_PASS.add(k));
function stepTab(d) { if (order.length < 2 || !order.includes(active)) return; const p = order[(order.indexOf(active) + d + order.length) % order.length]; activate(p); if (editor && files.has(p)) editor.focus(); }
const EDITOR_KEYS = ['Ctrl+Z', 'Ctrl+Y', 'Ctrl+F', 'Ctrl+H', 'Ctrl+/', 'Ctrl+G'];
window.addEventListener('keydown', e => {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
  if (e.key === 'Escape') { if (!$('#modal').classList.contains('hidden')) closeModal(); $('#ctx').classList.add('hidden'); return; }
  // with Ctrl/Alt held, letters come from the physical key so shortcuts work on any keyboard layout
  const key = e.key.length === 1 ? ((e.ctrlKey || e.metaKey || e.altKey) && /^Key[A-Z]$/.test(e.code || '') ? e.code.slice(3) : e.key.toUpperCase()) : e.key;
  const k = (e.ctrlKey || e.metaKey ? 'Ctrl+' : '') + (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '') + key;
  if (e.target.closest && e.target.closest('.xterm') && !TERM_PASS.has(k)) return;
  if (k === 'Ctrl+Enter' && document.activeElement.id === 'g-msg') { e.preventDefault(); return gCommit(); }
  const modalOpen = !$('#modal').classList.contains('hidden'), typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  if (!modalOpen && !typing && e.target.closest && e.target.closest('#v-explorer')) {
    if (EK[k]) { e.preventDefault(); EK[k](); return; }
    if (explorerNav(e)) { e.preventDefault(); return; }
  }
  if (EDITOR_KEYS.includes(k)) {   // Monaco handles these itself once it has focus; hand focus over if it does not yet
    if (!modalOpen && !typing && editor && files.has(active) && !editor.hasTextFocus()) { e.preventDefault(); editor.focus(); if (KEYS[k]) KEYS[k](); }
    return;
  }
  if (KEYS[k]) { e.preventDefault(); e.stopPropagation(); KEYS[k](); }
}, true);
document.addEventListener('click', e => { const c = e.target.closest('[data-cmd]'); if (c && byLabel[c.dataset.cmd]) byLabel[c.dataset.cmd][2](); });

/* ---------- Layout: side views, resizers ---------- */
function setView(v) {
  sideView = v; $('#side').classList.remove('hidden'); $('#rz-side').classList.remove('hidden');
  ['explorer', 'search', 'git'].forEach(x => { $('#v-' + x).classList.toggle('hidden', x !== v); document.querySelector(`#act [data-view=${x}]`).classList.toggle('on', x === v); });
  $('#side-title').textContent = { explorer: 'EXPLORER', search: 'SEARCH', git: 'SOURCE CONTROL' }[v]; $('#sh-ex').classList.toggle('hidden', v !== 'explorer'); $('#sh-git').classList.toggle('hidden', v !== 'git'); if (v === 'git') refreshGit(); persist();
}
document.querySelectorAll('#act [data-view]').forEach(b => { b.onclick = () => setView(b.dataset.view); });
initExplorerUI();
function drag(h, cb) {
  h.onmousedown = e => {
    e.preventDefault(); h.classList.add('on'); document.body.style.cursor = getComputedStyle(h).cursor;
    const up = () => { removeEventListener('mousemove', cb); removeEventListener('mouseup', up); h.classList.remove('on'); document.body.style.cursor = ''; persist(); };
    addEventListener('mousemove', cb); addEventListener('mouseup', up);
  };
}

/* ---------- Boot ---------- */
function fail(msg) {
  const w = $('#welcome'); w.classList.remove('hidden');
  order = [WELCOME]; active = WELCOME; renderTabs();
  w.insertAdjacentHTML('afterbegin', `<pre style="color:#e06c75;text-align:left;max-width:90%;white-space:pre-wrap;user-select:text">${esc(msg)}</pre>`);
}
window.addEventListener('error', e => toast('Error: ' + e.message, 'err'));
window.addEventListener('unhandledrejection', e => toast('Error: ' + clean(e.reason), 'err'));

function loadMonaco() {
  return new Promise((res, rej) => {
    const vs = new URL('../node_modules/monaco-editor/min/vs', location.href).href;
    const t = setTimeout(() => rej(new Error('Monaco did not load within 15s.\nExpected: ' + vs + '/loader.js')), 15000);
    require.config({ paths: { vs } });
    require.onError = e => { clearTimeout(t); rej(new Error('Monaco load error: ' + (e.requireModules || []).join(', ') + ' ' + (e.message || ''))); };
    self.MonacoEnvironment = { getWorker: () => new Worker(new URL('editor.worker.js', location.href)) };
    require(['vs/editor/editor.main'], () => { clearTimeout(t); res(); });
  });
}
function initEditor() {
  defineThemes();
  editor = monaco.editor.create($('#editor-host'), { model: null, automaticLayout: true, theme: S.theme, bracketPairColorization: { enabled: true }, smoothScrolling: true, scrollBeyondLastLine: false, mouseWheelZoom: true, padding: { top: 8 }, quickSuggestions: true, formatOnPaste: true, renderLineHighlight: 'all' });
  editor.onDidChangeCursorPosition(e => { $('#st-pos').textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`; });
  applySettings();
}

async function boot() {
  /* 1) UI that does not depend on Monaco: works even if the editor fails to load */
  st = await api.state_get(); S = { ...DEF, ...(st.settings || {}) }; applyTheme();
  buildMenus();
  sideW = st.sideW || 260; panelH = st.panelH || 200; $('#side').style.width = sideW + 'px'; $('#panel').style.height = panelH + 'px';
  drag($('#rz-side'), e => { sideW = clamp(e.clientX - 48, 160, 600); $('#side').style.width = sideW + 'px'; });
  drag($('#rz-panel'), e => {
    // follows the mouse 1:1 all the way to the top (no snapping); the splitter also works while maximized
    const want = $('#main').getBoundingClientRect().bottom - e.clientY;
    panelH = clamp(want, 80, panelLimit()); if (panelMax) setPanelMax(false); else applyPanel();
  });
  panelH = clamp(panelH, 80, 4000); applyPanel(); addEventListener('resize', applyPanel);
  $('#w-min').onclick = () => api.win_min(); $('#w-max').onclick = () => api.win_max(); $('#w-close').onclick = () => api.win_close();
  $('#title').addEventListener('dblclick', e => { if (!e.target.closest('button,.mb')) api.win_max(); });
  api.on('win:state', m => { $('#w-max').innerHTML = m ? '<i class="fa-regular fa-clone"></i>' : '<i class="fa-regular fa-square"></i>'; });
  $('#tree-refresh').onclick = () => { refreshTree(); indexFiles(); gRefreshNow(); };
  $('#s-in').addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(searchT); runSearch(); } });
  $('#s-in').addEventListener('input', () => { clearTimeout(searchT); searchT = setTimeout(runSearch, 300); });
  $('#s-case-btn').onclick = () => { const c = $('#s-case'); c.checked = !c.checked; $('#s-case-btn').classList.toggle('on', c.checked); runSearch(); }; $('#g-commit').onclick = () => gCommit(); $('#g-more').onclick = gMoreMenu; $('#g-sync').onclick = () => gSync(); $('#g-fetch').onclick = () => gFetch(); $('#g-refresh').onclick = () => gRefreshNow();
  $('#g-branch').onclick = gBranchMenu; $('#st-branch').onclick = gBranchMenu; $('#g-msg').addEventListener('input', gAuto);
  addEventListener('focus', refreshGit);
  // desktop behavior: dropping files/folders onto the window opens them instead of navigating away
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', async e => {
    e.preventDefault();
    for (const f of e.dataTransfer ? [...e.dataTransfer.files] : []) {
      const p = api.pathFor(f); if (!p) continue;
      let isDir = false; try { await api.fs_readdir(p); isDir = true; } catch { /* a file */ }
      if (isDir) await setFolder(p); else await openFile(p);
    }
  });
  api.on('app:close', async () => { if (await confirmQuit()) { await api.state_set(snapshot()); api.win_force(); } });
  api.on('update:status', onUpdate); api.update_state().then(s => { if (s) onUpdate(s, true); }).catch(() => { });
  $('#st-update').onclick = installUpdate;
  setView(st.sideView || 'explorer');
  if (st.folder && S.restoreSession) { root = st.folder; expanded = new Set(st.expanded || []); }
  try { const info = await api.app_info(); HOME = info.home; IS_WIN = !!info.win; WIN_BUILD = info.winBuild || 0; SHELLS = await api.pty_shells(); } catch { /* optional */ }
  initTermUI(); (st.terms || []).forEach(x => newTerm({ ...x, silent: true }));
  refreshTree(); indexFiles(); refreshGit(); runSearch();

  /* 2) Editor */
  try { await loadMonaco(); initEditor(); } catch (e) { fail(e.message); return; }
  if (S.restoreSession) for (const p of st.tabs || []) await openFile(p);
  if (st.active && files.has(st.active)) activate(st.active); else if (!order.length) openWelcome();
  // files passed by the OS ("Open with", double-click, drag onto exe)
  const openExternal = async list => { let last; for (const p of list || []) { await openFile(p); last = p; } if (last && files.has(last)) activate(last); };
  api.on('app:open', openExternal);
  try { await openExternal(await api.app_pending()); } catch { /* optional */ }
}
boot().catch(e => fail('Startup error: ' + (e.stack || e)));
