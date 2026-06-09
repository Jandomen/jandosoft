const chalk = require('chalk');
const readline = require('readline');
const inquirer = require('inquirer').default;
const { request } = require('../lib/api');

async function listConversations() {
  const data = await request('GET', '/api/conversations');
  const convos = data.conversations || [];

  const choices = [
    { name: `  ${chalk.cyan('✉')}  ${chalk.bold('Nueva conversación')}`, value: '__new__', short: 'Nueva' },
    new inquirer.Separator(),
  ];

  if (convos.length === 0) {
    choices.push({ name: `  ${chalk.dim('(sin conversaciones)')}`, value: '__none__', short: '' });
  }

  for (const c of convos) {
    const other = (c.participants || []).find((p) => p.userId !== '__me__') || c.participants?.[0];
    const label = other?.name || other?.email || 'Desconocido';
    const last = c.lastMessage
      ? chalk.dim(` — ${c.lastMessage.slice(0, 60)}`)
      : '';
    choices.push({
      name: `  ${chalk.green('●')} ${chalk.bold(label)}${last}`,
      value: c._id,
      short: label,
      conv: c,
    });
  }

  choices.push(new inquirer.Separator());
  choices.push({ name: `  ${chalk.red('◆')} ${chalk.bold('Volver')}`, value: 'back', short: 'Volver' });

  const { convoId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'convoId',
      message: `${chalk.bold(' Conversaciones')}`,
      choices,
      pageSize: 12,
      prefix: '',
      loop: false,
    },
  ]);

  if (convoId === '__new__') return '__new__';
  return convoId === 'back' ? null : convoId;
}

async function createConversation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const email = await new Promise((resolve) => {
    rl.question(` ${chalk.cyan('‣ Email del usuario:')} `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!email) {
    console.log(` ${chalk.yellow(' Email requerido.')}\n`);
    return null;
  }

  console.log(` ${chalk.dim(' Creando conversación...')}`);
  try {
    const data = await request('POST', '/api/conversations', { participantEmail: email });
    const convo = data.conversation || data;
    console.log(` ${chalk.green('✓')} Conversación creada con ${chalk.bold(email)}\n`);
    return convo._id;
  } catch {
    console.log(` ${chalk.red('✖')} No se pudo crear la conversación. Verifica el email.\n`);
    return null;
  }
}

async function showMessages(convoId) {
  const data = await request('GET', `/api/conversations/${convoId}/messages`);
  const messages = data.messages || [];

  console.log(`\n ${chalk.bold(` Mensajes (${messages.length})`)}\n`);

  for (const m of messages) {
    const sender = m.senderName || m.senderEmail || 'Desconocido';
    const isMe = m._isMine;
    const color = isMe ? chalk.cyan : chalk.green;
    const time = m.createdAt ? new Date(m.createdAt).toLocaleString() : '';
    console.log(` ${color.bold('●')} ${color.bold(sender)} ${chalk.dim(time)}`);
    console.log(`   ${m.content}\n`);
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `${chalk.bold('Acción')}`,
      choices: [
        { name: `  ${chalk.cyan('✉')}  ${chalk.bold('Responder')}`, value: 'reply', short: 'Responder' },
        { name: `  ${chalk.red('◆')}  ${chalk.bold('Volver')}`, value: 'back', short: 'Volver' },
      ],
      prefix: '',
      loop: false,
    },
  ]);

  if (action === 'reply') {
    await sendMessage(convoId);
    return true;
  }

  return false;
}

async function sendMessage(convoId) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const content = await new Promise((resolve) => {
    rl.question(` ${chalk.cyan('‣ Mensaje:')} `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!content) {
    console.log(` ${chalk.yellow(' Mensaje vacío.')}\n`);
    return;
  }

  console.log(` ${chalk.dim(' Enviando...')}`);
  await request('POST', `/api/conversations/${convoId}/messages`, { content });
  console.log(` ${chalk.green('✓')} Mensaje enviado\n`);
}

async function showChatHistory() {
  const { getSessions } = require('../lib/history');
  const sessions = getSessions();

  console.log(`\n ${chalk.bold('📜 Historial de Chat con IA')}\n`);

  if (sessions.length === 0) {
    console.log(`   ${chalk.yellow('Sin historial de chat aún.')}\n`);
    return;
  }

  const choices = sessions.map((s, i) => ({
    name: `  ${chalk.magenta('🤖')} ${chalk.bold(s.store)} ${chalk.dim(`— ${new Date(s.startedAt).toLocaleDateString()} (${s.messages.length} msgs)`)}`,
    value: i,
    short: s.store,
  }));

  choices.push(new inquirer.Separator());
  choices.push({ name: `  ${chalk.red('◆')} ${chalk.bold('Volver')}`, value: '__back__', short: 'Volver' });

  const { idx } = await inquirer.prompt([
    {
      type: 'list',
      name: 'idx',
      message: `${chalk.bold('Sesiones guardadas')}`,
      choices,
      pageSize: 12,
      prefix: '',
      loop: false,
    },
  ]);

  if (idx === '__back__') return;

  const session = sessions[idx];
  console.log(`\n ${chalk.bold(`📜 ${session.store}`)} ${chalk.dim(new Date(session.startedAt).toLocaleString())}\n`);
  for (const m of session.messages) {
    const prefix = m.role === 'user' ? chalk.cyan('Tú:') : chalk.magenta('IA:');
    console.log(` ${prefix} ${m.content.slice(0, 300)}`);
  }
  console.log('');
}

async function handler(args) {
  if (args[0] === 'history') {
    await showChatHistory();
    return;
  }

  console.log(`\n ${chalk.bold('💬 Conversaciones en tiempo real')}\n`);

  while (true) {
    const convoId = await listConversations();
    if (!convoId) break;

    if (convoId === '__new__') {
      const newId = await createConversation();
      if (newId) {
        await showMessages(newId);
      }
      continue;
    }

    if (convoId === '__none__') continue;

    const shouldRefresh = await showMessages(convoId);
    if (!shouldRefresh) {
      await inquirer.prompt([{ type: 'input', name: '_', message: `${chalk.dim('Presiona Enter para volver...')}`, prefix: '' }]);
    }
  }
}

module.exports = { handler };
