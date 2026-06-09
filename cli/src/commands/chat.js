const chalk = require('chalk');
const readline = require('readline');
const inquirer = require('inquirer').default;
const { request, BASE_URL } = require('../lib/api');
const config = require('../lib/config');
const { selectStore } = require('../lib/store-picker');
const { saveSession } = require('../lib/history');

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

async function createStoreInline() {
  const userData = await request('GET', '/api/auth/me');
  const user = userData.user || {};
  const plan = user.subscription || 'free';
  const maxStores = { free: 3, basic: 10, enterprise: 999 }[plan] || 3;
  const storeCount = userData.organization?.storesCount || 0;

  console.log(`\n ${chalk.bold('🆕 Crear nueva tienda')}`);
  console.log(`   ${chalk.dim(`Plan:`)} ${chalk.cyan(plan.toUpperCase())} ${chalk.dim(`— ${storeCount}/${maxStores} tiendas`)}`);

  if (storeCount >= maxStores) {
    console.log(` ${chalk.red('🚫')} ${chalk.red.bold(`Límite de ${maxStores} tiendas alcanzado.`)}`);
    console.log(` ${chalk.dim('  Haz upgrade de tu plan para crear más tiendas.')}\n`);
    return null;
  }
  if (storeCount >= maxStores * 0.8) {
    console.log(` ${chalk.yellow('⚠️')} ${chalk.yellow(`Estás usando ${storeCount}/${maxStores} tiendas — cerca del límite.`)}\n`);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const name = await new Promise((resolve) => {
    rl.question(` ${chalk.cyan('‣ Nombre de la tienda:')} `, (answer) => { rl.close(); resolve(answer.trim()); });
  });

  if (!name) { console.log(` ${chalk.yellow(' Nombre requerido.')}\n`); return null; }

  const token = config.get('token');
  try {
    const res = await fetch(`${BASE_URL}/api/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.log(` ${chalk.red('✖')} ${data.error || data.message || `Error ${res.status}`}\n`);
      return null;
    }
    const store = data.store || data;
    console.log(` ${chalk.green('✓')} Tienda ${chalk.bold(store.name)} creada.\n`);
    return store;
  } catch (err) {
    console.log(` ${chalk.red('✖ Error de conexión:')} ${err.message}\n`);
    return null;
  }
}

async function pickStoreOrGeneric() {
  const store = await selectStore();
  if (store === '__create__') {
    const created = await createStoreInline();
    return created || null;
  }
  if (store) {
    const [storeData, userData] = await Promise.all([
      request('GET', `/api/stores/${store._id || store.id}`),
      request('GET', '/api/auth/me'),
    ]);
    const full = storeData.store || storeData;
    const user = userData.user || {};
    full._subscription = {
      plan: user.subscription || 'free',
      expiry: user.subscriptionExpiry || null,
      maxStores: { free: 3, basic: 10, enterprise: 999 }[user.subscription || 'free'] || 3,
      maxProducts: { free: 20, basic: 100, enterprise: 9999 }[user.subscription || 'free'] || 20,
    };
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

  if (choice === 'generic') {
    const [userData, storesData] = await Promise.all([
      request('GET', '/api/auth/me'),
      request('GET', '/api/stores'),
    ]);
    const user = userData.user || {};
    const stores = storesData.stores || [];
    const genericCtx = {
      name: 'Jandosoft',
      _generic: true,
      _subscription: {
        plan: user.subscription || 'free',
        expiry: user.subscriptionExpiry || null,
        maxStores: { free: 3, basic: 10, enterprise: 999 }[user.subscription || 'free'] || 3,
        maxProducts: { free: 20, basic: 100, enterprise: 9999 }[user.subscription || 'free'] || 20,
      },
      _stores: stores.map((s) => ({
        _id: s._id || s.id,
        name: s.name,
        slug: s.slug,
        productsCount: (s.products || []).length,
      })),
    };
    console.log(` ${chalk.dim(` Cuenta: ${(user.subscription || 'free').toUpperCase()} — ${genericCtx._subscription.maxStores} tiendas máx, ${stores.length} tienda(s) actual(es)`)}\n`);
    return genericCtx;
  }

  return null;
}

function chatSession(store) {
  const history = [];
  const isGeneric = store._generic;

  return new Promise((resolve) => {
    const contextLabel = isGeneric
      ? chalk.dim('(genérico)')
      : chalk.dim(`(${store.name})`);

    console.log(`\n ${chalk.bold('🤖 Jandosoft AI Chat')} ${contextLabel}`);
    if (!isGeneric) {
      const sub = store._subscription || {};
      const productCount = store.products?.length || 0;
      const maxP = sub.maxProducts || 20;
      if (productCount >= maxP) {
        console.log(` ${chalk.red('🚫')} ${chalk.red.bold(`Límite de productos alcanzado (${productCount}/${maxP})`)}`);
      } else if (productCount >= maxP * 0.8) {
        console.log(` ${chalk.yellow('⚠️')} ${chalk.yellow(`Usando ${productCount}/${maxP} productos — cerca del límite.`)}`);
      }
    }
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

      process.stdout.write(` ${chalk.dim(' Jandosoft IA pensando...')}\r`);

      const result = await aiChat(
        msg,
        store,
        history.slice(0, -1),
      );

      if (result.error) {
        console.log(` ${chalk.red('✖ Error:')} ${result.error}\n`);
      } else {
        const actions = result.data.actions || [];
        for (const a of actions) {
          if (a.result?.success) {
            console.log(` ${chalk.green('✓')} ${a.result.message}`);
          } else if (a.result?.error) {
            console.log(` ${chalk.red('✖')} ${a.result.error}`);
          }
        }
        const reply = result.data.response || 'Sin respuesta';
        history.push({ role: 'assistant', content: reply });
        console.log(` ${chalk.magenta.bold('✦ Jandosoft IA:')} ${reply}\n`);
      }

      rl.prompt();
    });

    rl.on('close', () => {
      if (history.length > 0) {
        saveSession(isGeneric ? 'Genérico' : store.name, history);
      }
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
