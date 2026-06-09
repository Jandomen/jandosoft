const readline = require('readline');
const chalk = require('chalk');
const { request } = require('../lib/api');
const config = require('../lib/config');

function ask(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function handler() {
  console.log(`\n${chalk.bold(' Iniciar sesión en Jandosoft')}\n`);

  const email = await ask(` ${chalk.cyan('‣ Email:')} `);
  if (!email) {
    console.log(` ${chalk.red('✖ El email es requerido')}\n`);
    return;
  }

  const password = await ask(` ${chalk.cyan('‣ Contraseña:')} `);
  if (!password) {
    console.log(` ${chalk.red('✖ La contraseña es requerida')}\n`);
    return;
  }

  console.log(` ${chalk.dim(' Autenticando...')}`);

  const data = await request('POST', '/api/auth/login', { email, password }, false);

  config.save({ token: data.token, email: data.user.email, name: data.user.name });

  console.log(`\n ${chalk.green.bold('✓ Inicio de sesión exitoso')}`);
  console.log(` ${chalk.dim(`Bienvenido, ${chalk.bold(data.user.name || data.user.email)}!`)}`);
  console.log(` ${chalk.dim(`Organización: ${data.user.organizationId || '—'}`)}`);
  console.log(` ${chalk.dim(`Rol: ${data.user.role || '—'}`)}\n`);
}

module.exports = { handler };
