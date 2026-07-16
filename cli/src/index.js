#!/usr/bin/env node

const chalk = require('chalk');
const inquirer = require('inquirer').default;
const { BASE_URL } = require('./lib/api');
const config = require('./lib/config');

const login = require('./commands/login');
const me = require('./commands/me');
const stores = require('./commands/stores');
const org = require('./commands/org');
const status = require('./commands/status');
const chat = require('./commands/chat');
const conversations = require('./commands/conversations');
const notifications = require('./commands/notifications');
const barbershop = require('./commands/barbershop');
const restaurant = require('./commands/restaurant');

const [, , cmd, ...args] = process.argv;

if (cmd === '--version' || cmd === '-v') {
  console.log(`Jandosoft CLI v2.0.0`);
  process.exit(0);
}

function logo() {
  console.log('');
  console.log(`  ${chalk.red.bold('       ██╗ █████╗ ███╗   ██╗██████╗  ██████╗ ███████╗ ██████╗ ███████╗████████╗')}`);
  console.log(`  ${chalk.red.bold('       ██║██╔══██╗████╗  ██║██╔══██╗██╔═══██╗██╔════╝██╔═══██╗██╔════╝╚══██╔══╝')}`);
  console.log(`  ${chalk.red.bold('       ██║███████║██╔██╗ ██║██║  ██║██║   ██║███████╗██║   ██║█████╗     ██║   ')}`);
  console.log(`  ${chalk.red.bold('  ██   ██║██╔══██║██║╚██╗██║██║  ██║██║   ██║╚════██║██║   ██║██╔══╝     ██║   ')}`);
  console.log(`  ${chalk.red.bold('  ╚█████╔╝██║  ██║██║ ╚████║██████╔╝╚██████╔╝███████║╚██████╔╝██║        ██║   ')}`);
  console.log(`  ${chalk.red.bold('   ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝        ╚═╝   ')}`);
  console.log(`  ${chalk.dim(`                           CLI v2.0.0 — ${BASE_URL}`)}`);
  console.log('');
}

async function showMenu() {
  const cfg = config.load();
  const authed = !!cfg.token;
  const email = cfg.email || '';

  const choices = [];

  if (!authed) {
    choices.push({ name: `${chalk.cyan('◆')}  ${chalk.bold('Iniciar Sesión')}`, value: 'login', short: 'Login' });
    choices.push(new inquirer.Separator());
    choices.push({ name: `${chalk.magenta('◆')}  ${chalk.bold('AI Chat')}            ${chalk.dim('sin cuenta')}`, value: 'chat', short: 'Chat' });
    choices.push({ name: `${chalk.cyan('◆')}  ${chalk.bold('Estado del Servidor')}`, value: 'status', short: 'Status' });
    choices.push({ name: `${chalk.cyan('◆')}  ${chalk.bold('Configuración')}      ${chalk.dim('sin sesión')}`, value: 'config', short: 'Config' });
  } else {
    choices.push({ name: `${chalk.green('●')}  ${chalk.bold('Mi Perfil')}          ${chalk.dim(email)}`, value: 'me', short: 'Perfil' });
    choices.push({ name: `${chalk.green('●')}  ${chalk.bold('Mis Empresas')}`, value: 'stores', short: 'Empresas' });
    choices.push({ name: `${chalk.green('●')}  ${chalk.bold('Organización')}`, value: 'org', short: 'Org' });
    choices.push(new inquirer.Separator());
    choices.push({ name: `${chalk.magenta('◆')}  ${chalk.bold('AI Chat')}            ${chalk.dim('IA de Jandosoft')}`, value: 'chat', short: 'Chat' });
    choices.push({ name: `${chalk.magenta('◆')}  ${chalk.bold('Conversaciones')}    ${chalk.dim('mensajes en vivo')}`, value: 'conversations', short: 'Convos' });
    choices.push({ name: `${chalk.yellow('🔔')}  ${chalk.bold('Notificaciones')}`, value: 'notifications', short: 'Notifs' });
    choices.push(new inquirer.Separator());
    choices.push({ name: `${chalk.cyan('✂️')}  ${chalk.bold('Barbería')}           ${chalk.dim('barberos, cola, historial')}`, value: 'barbershop', short: 'Barbería' });
    choices.push({ name: `${chalk.green('🍽️')}  ${chalk.bold('Restaurante')}        ${chalk.dim('menú, pedidos, reservaciones')}`, value: 'restaurant', short: 'Restaurante' });
    choices.push(new inquirer.Separator());
    choices.push({ name: `${chalk.cyan('◆')}  ${chalk.bold('Estado del Servidor')}`, value: 'status', short: 'Status' });
    choices.push({ name: `${chalk.cyan('◆')}  ${chalk.bold('Configuración')}`, value: 'config', short: 'Config' });
    choices.push(new inquirer.Separator());
    choices.push({ name: `${chalk.yellow('◆')}  ${chalk.bold('Cerrar Sesión')}`, value: 'logout', short: 'Logout' });
  }

  choices.push(new inquirer.Separator());
  choices.push({ name: `${chalk.red('◆')}  ${chalk.bold('Salir')}`, value: 'exit', short: 'Salir' });

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `${chalk.bold('Selecciona una opción')}  ${chalk.dim('[usa las flechas ↵ para navegar]')}`,
      choices,
      pageSize: 14,
      prefix: '',
      loop: false,
    },
  ]);

  return action;
}

async function handleAction(action) {
  switch (action) {
    case 'login':
      await login.handler(args);
      break;
    case 'me':
      await me.handler(args);
      break;
    case 'stores':
      await stores.handler(args);
      break;
    case 'org':
      await org.handler(args);
      break;
    case 'chat':
      await chat.handler(args);
      break;
    case 'conversations':
      await conversations.handler(args);
      break;
    case 'notifications':
      await notifications.handler(args);
      break;
    case 'barbershop':
      await barbershop.handler(args);
      break;
    case 'restaurant':
      await restaurant.handler(args);
      break;
    case 'chathistory':
      await conversations.handler(['history']);
      break;
    case 'status':
      await status.handler(args);
      break;
    case 'config':
      const cfg = config.load();
      console.log(`\n ${chalk.bold(' Configuración local')}\n`);
      console.log(`   ${chalk.dim('📁 Archivo:')} ${chalk.cyan(config.CONFIG_PATH)}`);
      console.log(`   ${chalk.dim('🔑 Token:')}   ${cfg.token ? chalk.green('✓ configurado') : chalk.yellow('✖ vacío')}`);
      console.log(`   ${chalk.dim('📧 Email:')}   ${cfg.email ? chalk.green(cfg.email) : chalk.yellow('(no guardado)')}`);
      console.log('');
      break;
    case 'logout':
      config.clear();
      console.log(`\n ${chalk.green('✓')} Sesión cerrada. Token eliminado.\n`);
      break;
    case 'exit':
      console.log(`\n ${chalk.dim(' Hasta luego!')}\n`);
      process.exit(0);
  }
}

async function runDirectCommand() {
  try {
    switch (cmd) {
      case 'login':
        await login.handler(args);
        break;
      case 'me':
        logo();
        await me.handler(args);
        break;
      case 'stores':
        logo();
        await stores.handler(args);
        break;
      case 'org':
        logo();
        await org.handler(args);
        break;
      case 'chat':
        logo();
        await chat.handler(args);
        break;
      case 'conversations':
        logo();
        await conversations.handler(args);
        break;
      case 'notifications':
        logo();
        await notifications.handler(args);
        break;
      case 'barbershop':
        logo();
        await barbershop.handler(args);
        break;
      case 'restaurant':
        logo();
        await restaurant.handler(args);
        break;
      case 'status':
        logo();
        await status.handler(args);
        break;
      case 'config':
        logo();
        const cfg = config.load();
        console.log(`\n ${chalk.bold(' Configuración local')}\n`);
        console.log(`   ${chalk.dim('📁 Archivo:')} ${chalk.cyan(config.CONFIG_PATH)}`);
        console.log(`   ${chalk.dim('🔑 Token:')}   ${cfg.token ? chalk.green('✓ configurado') : chalk.yellow('✖ vacío')}`);
        console.log(`   ${chalk.dim('📧 Email:')}   ${cfg.email ? chalk.green(cfg.email) : chalk.yellow('(no guardado)')}`);
        console.log('');
        break;
      case 'logout':
        logo();
        config.clear();
        console.log(`\n ${chalk.green('✓')} Sesión cerrada. Token eliminado.\n`);
        break;
      case 'help':
      case undefined:
      case '':
        await menuLoop();
        break;
      default:
        if (cmd !== undefined) {
          console.log(`\n ${chalk.red.bold(`✖ Comando desconocido: "${cmd}"`)}\n`);
        }
        await menuLoop();
    }
  } catch (err) {
    console.log(`\n${chalk.red.bold(' ✖ Error')} ${err.message}\n`);
    process.exit(1);
  }
}

async function menuLoop() {
  while (true) {
    console.clear();
    logo();
    const action = await showMenu();
    if (action === 'exit') {
      console.log(`\n ${chalk.dim(' Hasta luego!')}\n`);
      process.exit(0);
    }
    try {
      await handleAction(action);
    } catch (err) {
      console.log(`\n${chalk.red.bold(' ✖ Error')} ${err.message}\n`);
    }
    const skipPause = ['login', 'logout', 'chat', 'stores', 'conversations'];
    if (!skipPause.includes(action)) {
      await inquirer.prompt([{ type: 'input', name: '_', message: `${chalk.dim('Presiona Enter para volver al menú...')}`, prefix: '' }]);
    }
  }
}

async function main() {
  if (cmd && cmd !== 'help' && cmd !== '') {
    await runDirectCommand();
  } else {
    await menuLoop();
  }
}

main().catch((err) => {
  if (cmd && cmd !== 'help' && cmd !== '') {
    console.error(`\n ${chalk.red.bold('✖ Error inesperado:')} ${err.message}\n`);
    process.exit(1);
  }
});
