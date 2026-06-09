const chalk = require('chalk');
const inquirer = require('inquirer').default;
const { request } = require('../lib/api');

async function listConversations() {
  const data = await request('GET', '/api/conversations');
  const convos = data.conversations || [];

  if (convos.length === 0) {
    console.log(`\n ${chalk.yellow(' No tienes conversaciones aún.')}\n`);
    return null;
  }

  const choices = convos.map((c) => {
    const other = (c.participants || []).find((p) => p.userId !== 'you') || c.participants?.[0];
    const label = other?.name || other?.email || 'Desconocido';
    const last = c.lastMessage
      ? chalk.dim(` — ${c.lastMessage.slice(0, 60)}`)
      : '';
    return {
      name: `  ${chalk.green('●')} ${chalk.bold(label)}${last}`,
      value: c._id,
      short: label,
    };
  });

  choices.push(new inquirer.Separator());
  choices.push({ name: `  ${chalk.red('◆')} ${chalk.bold('Volver')}`, value: 'back', short: 'Volver' });

  const { convoId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'convoId',
      message: `${chalk.bold(' Conversaciones')}`,
      choices,
      pageSize: 10,
      prefix: '',
      loop: false,
    },
  ]);

  return convoId === 'back' ? null : convoId;
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
}

async function handler() {
  console.log(`\n ${chalk.bold('💬 Historial de Conversaciones')}\n`);

  while (true) {
    const convoId = await listConversations();
    if (!convoId) break;
    await showMessages(convoId);
    await inquirer.prompt([{ type: 'input', name: '_', message: `${chalk.dim('Presiona Enter para volver...')}`, prefix: '' }]);
  }
}

module.exports = { handler };
