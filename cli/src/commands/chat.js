const chalk = require('chalk');
const readline = require('readline');
const inquirer = require('inquirer').default;
const { request, BASE_URL } = require('../lib/api');
const config = require('../lib/config');
const { selectStore } = require('../lib/store-picker');

async function aiChat(message, store, history) {
  const headers = { 'Content-Type': 'application/json' };
  const token = config.get('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, store, history }),
    });
    const text = await res.text();
    if (!text) return { error: 'Respuesta vacía del servidor' };
    const data = JSON.parse(text);
    if (!res.ok) return { error: data.error || data.message || `Error ${res.status}` };
    return { data };
  } catch (err) {
    return { error: err.message };
  }
}

async function pickStoreOrGeneric() {
  const store = await selectStore();
  if (store === '__create__') {
    console.log(` ${chalk.yellow(' Crea una tienda desde')} ${chalk.cyan('jandosoft stores create')} ${chalk.yellow('primero.')}\n`);
    return null;
  }
  if (store) {
    const data = await request('GET', `/api/stores/${store._id || store.id}`);
    const full = data.store || data;
    console.log(` ${chalk.dim(` Contexto cargado: ${full.products?.length || 0} productos, ${full.customers?.length || 0} clientes, ${full.orders?.length || 0} órdenes, ${full.services?.length || 0} servicios`)}\n`);
    return full;
  }

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: `${chalk.bold('¿Sobre qué tienda quieres consultar?')}`,
      choices: [
        { name: `  ${chalk.cyan('💬')}  ${chalk.bold('Chat genérico sin tienda')}`, value: 'generic', short: 'Genérico' },
        { name: `  ${chalk.red('◆')}  ${chalk.bold('Volver')}`, value: 'back', short: 'Volver' },
      ],
      prefix: '',
      loop: false,
    },
  ]);

  return choice === 'back' ? null : 'generic';
}

function chatSession(store) {
  const history = [];

  return new Promise((resolve) => {
    const contextLabel = store === 'generic'
      ? chalk.dim('(genérico)')
      : chalk.dim(`(${store.name})`);

    console.log(`\n ${chalk.bold('🤖 Jandosoft AI Chat')} ${contextLabel}`);
    console.log(` ${chalk.dim(' Escribe tu mensaje o')} ${chalk.yellow('/exit')} ${chalk.dim('para salir')}`);
    console.log(` ${chalk.dim(' Usa')} ${chalk.yellow('/store')} ${chalk.dim('para cambiar de tienda')}\n`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `${chalk.cyan('‣')} ${chalk.bold('Tú:')} `,
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const msg = line.trim();
      if (!msg) { rl.prompt(); return; }

      if (msg.toLowerCase() === '/exit' || msg.toLowerCase() === '/quit') {
        console.log(`\n ${chalk.dim(' Chat finalizado.\n')}`);
        rl.close();
        return;
      }

      if (msg.toLowerCase() === '/store') {
        rl.close();
        return;
      }

      history.push({ role: 'user', content: msg });

      process.stdout.write(` ${chalk.dim(' AI pensando...')}\r`);

      const result = await aiChat(
        msg,
        store === 'generic' ? null : store,
        history.slice(0, -1),
      );

      if (result.error) {
        console.log(` ${chalk.red('✖ Error:')} ${result.error}\n`);
      } else {
        const reply = result.data.response || 'Sin respuesta';
        history.push({ role: 'assistant', content: reply });
        console.log(` ${chalk.green.bold('AI:')} ${reply}\n`);
      }

      rl.prompt();
    });

    rl.on('close', () => {
      resolve();
    });
  });
}

async function startChat() {
  while (true) {
    console.clear();
    const store = await pickStoreOrGeneric();
    if (!store) break;
    console.clear();
    await chatSession(store);
  }
}

async function handler() {
  await startChat();
}

module.exports = { handler };
