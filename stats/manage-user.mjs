// Add, remove or list stats dashboard users.
//   zend-stats-user add <name>      asks for the password (typed, not shown)
//   zend-stats-user remove <name>
//   zend-stats-user list
// Passwords are stored as scrypt hashes in STATS_USERS_FILE
// (default /etc/zend-stats/users.json). Signed-in sessions of a removed user
// end at the next restart of zend-stats (the setup command restarts it).

import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }; // same as server.mjs
const FILE = process.env.STATS_USERS_FILE ?? '/etc/zend-stats/users.json';
const [cmd, rawName] = process.argv.slice(2);
const name = String(rawName ?? '').trim().toLowerCase();

async function load() {
  try {
    return JSON.parse(await readFile(FILE, 'utf8'));
  } catch {
    return { users: {} };
  }
}
async function save(data) {
  const tmp = `${FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + '\n', { mode: 0o640 });
  await rename(tmp, FILE);
}

// Read a line from the terminal without echoing it.
function askHidden(prompt) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) return reject(new Error('Run this in a terminal (it asks for a password).'));
    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let s = '';
    const onData = (ch) => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          process.stdout.write('\n');
          return resolve(s);
        }
        if (c === '\u0003') {
          stdin.setRawMode(false);
          process.stdout.write('\n');
          process.exit(130);
        }
        if (c === '\u007f' || c === '\b') s = s.slice(0, -1);
        else s += c;
      }
    };
    stdin.on('data', onData);
  });
}

const valid = /^[a-z0-9._-]{2,32}$/;
const data = await load();
data.users ??= {};

if (cmd === 'list') {
  const names = Object.keys(data.users);
  console.log(names.length ? names.map((n) => `${n}  (added ${data.users[n].created ?? '?'})`).join('\n') : 'No users yet.');
} else if (cmd === 'add') {
  if (!valid.test(name)) {
    console.error('Name: 2-32 characters, lowercase letters, numbers, dot, dash or underscore.');
    process.exit(1);
  }
  const pw = await askHidden(`Password for ${name} (at least 12 characters): `);
  if (pw.length < 12) {
    console.error('Too short: use at least 12 characters.');
    process.exit(1);
  }
  if ((await askHidden('Type it again: ')) !== pw) {
    console.error("They don't match. Nothing changed.");
    process.exit(1);
  }
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64, SCRYPT);
  const existed = Boolean(data.users[name]);
  data.users[name] = { salt: salt.toString('base64'), hash: hash.toString('base64'), created: new Date().toISOString().slice(0, 10) };
  await save(data);
  console.log(existed ? `Password changed for ${name}.` : `Added ${name}.`);
} else if (cmd === 'remove') {
  if (!data.users[name]) {
    console.error(`No user called ${name}.`);
    process.exit(1);
  }
  delete data.users[name];
  await save(data);
  console.log(`Removed ${name}.`);
} else {
  console.log('Usage: zend-stats-user add <name> | remove <name> | list');
  process.exit(1);
}
