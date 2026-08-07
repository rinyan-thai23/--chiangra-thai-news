const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function readPayload() {
  const payloadPath = path.join(root, 'latest/payload.json');
  try {
    return JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  } catch (error) {
    throw new Error(`payload.jsonを読み込めません: ${error.message}`);
  }
}

function safePath(relativePath, fieldName) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    throw new Error(`${fieldName} が設定されていません。`);
  }
  const absolutePath = path.resolve(root, relativePath);
  const relativeToRoot = path.relative(root, absolutePath);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error(`${fieldName} はリポジトリ内を指定してください。`);
  }
  return absolutePath;
}

function prepare() {
  const payload = readPayload();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date || '')) throw new Error('payload.date が不正です。');
  if (typeof payload.title !== 'string' || !payload.title.trim()) throw new Error('payload.title が空です。');

  const messagePath = safePath(payload.message_path, 'message_path');
  if (!fs.existsSync(messagePath)) throw new Error(`message.txtが存在しません: ${payload.message_path}`);
  const text = fs.readFileSync(messagePath, 'utf8').trim();
  if (!text) throw new Error('message.txtが空です。');

  return {
    to: process.env.LINE_GROUP_ID || 'LINE_GROUP_ID_NOT_SET',
    messages: [{ type: 'text', text }]
  };
}

try {
  const lineMessage = prepare();
  console.log('LINE送信用データを準備しました（外部送信は行いません）。');
  console.log(JSON.stringify(lineMessage, null, 2));
} catch (error) {
  console.error(`Preparation failed: ${error.message}`);
  process.exitCode = 1;
}

