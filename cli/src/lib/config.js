const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(require('os').homedir(), '.jandosoft');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function load() {
  ensureDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function save(data) {
  ensureDir();
  const existing = load();
  const merged = { ...existing, ...data };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8');
}

function get(key) {
  return load()[key];
}

function clear() {
  ensureDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({}, null, 2), 'utf-8');
}

module.exports = { load, save, get, clear, CONFIG_PATH };
