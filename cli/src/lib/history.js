const fs = require('fs');
const path = require('path');
const os = require('os');

const HISTORY_DIR = path.join(os.homedir(), '.jandosoft');
const HISTORY_PATH = path.join(HISTORY_DIR, 'chat-history.json');

function ensure() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_PATH)) {
    fs.writeFileSync(HISTORY_PATH, JSON.stringify({ sessions: [] }, null, 2), 'utf-8');
  }
}

function load() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
  } catch {
    return { sessions: [] };
  }
}

function save(data) {
  ensure();
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function saveSession(storeName, messages) {
  const data = load();
  data.sessions.unshift({
    id: Date.now().toString(36),
    store: storeName,
    startedAt: new Date().toISOString(),
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content.slice(0, 500),
      at: new Date().toISOString(),
    })),
  });
  if (data.sessions.length > 50) data.sessions = data.sessions.slice(0, 50);
  save(data);
}

function getSessions() {
  return load().sessions;
}

module.exports = { saveSession, getSessions, HISTORY_PATH };
