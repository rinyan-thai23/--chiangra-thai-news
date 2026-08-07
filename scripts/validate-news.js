const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'latest/article.md',
  'latest/message.txt',
  'latest/payload.json'
];
const allowedStatuses = new Set(['draft', 'ready', 'processing', 'sent', 'error']);

function resolveRepositoryPath(relativePath, fieldName, errors) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    errors.push(`${fieldName} が空です。`);
    return null;
  }

  const absolutePath = path.resolve(root, relativePath);
  const relativeToRoot = path.relative(root, absolutePath);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    errors.push(`${fieldName} はリポジトリ内のパスを指定してください: ${relativePath}`);
    return null;
  }
  return absolutePath;
}

function validate() {
  const errors = [];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(root, file))) errors.push(`${file} が存在しません。`);
  }
  if (errors.length) return errors;

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(path.join(root, 'latest/payload.json'), 'utf8'));
  } catch (error) {
    errors.push(`latest/payload.json が正しいJSONではありません: ${error.message}`);
    return errors;
  }

  if (typeof payload.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    errors.push('date は YYYY-MM-DD 形式で指定してください。');
  } else {
    const parsed = new Date(`${payload.date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== payload.date) {
      errors.push(`date は実在する日付にしてください: ${payload.date}`);
    }
  }
  if (typeof payload.title !== 'string' || !payload.title.trim()) errors.push('title が空です。');
  if (!allowedStatuses.has(payload.status)) {
    errors.push(`status が不正です。許可値: ${[...allowedStatuses].join(', ')}`);
  }

  for (const field of ['article_path', 'message_path']) {
    const target = resolveRepositoryPath(payload[field], field, errors);
    if (target && !fs.existsSync(target)) errors.push(`${field} のファイルが存在しません: ${payload[field]}`);
  }
  if (payload.image_path != null && payload.image_path !== '') {
    const image = resolveRepositoryPath(payload.image_path, 'image_path', errors);
    if (image && !fs.existsSync(image)) errors.push(`image_path のファイルが存在しません: ${payload.image_path}`);
  }

  const article = fs.readFileSync(path.join(root, 'latest/article.md'), 'utf8');
  const firstLines = article.split(/\r?\n/).slice(0, 10).join('\n');
  if (typeof payload.title === 'string' && !firstLines.includes(payload.title.trim())) {
    errors.push('article.md の先頭10行以内に payload.title が見つかりません。');
  }
  const message = fs.readFileSync(path.join(root, 'latest/message.txt'), 'utf8');
  if (!message.trim()) errors.push('message.txt が空です。');

  return errors;
}

const errors = validate();
if (errors.length) {
  console.error('Validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Validation passed.');
}

