'use strict';
// Launcher: spawns Electron with a clean environment.
// Removes ELECTRON_RUN_AS_NODE so Electron initialises its browser process
// rather than falling back to plain Node.js mode.
const { spawn } = require('child_process');
const electron  = require('electron');
const path      = require('path');

const env = Object.assign({}, process.env);
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electron, [path.join(__dirname)], { stdio: 'inherit', env });
child.on('close', code => process.exit(code ?? 0));
