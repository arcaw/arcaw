const base = new URL('../node_modules/monaco-editor/min/', self.location.href).href;
self.MonacoEnvironment = { baseUrl: base };
importScripts(base + 'vs/base/worker/workerMain.js');
