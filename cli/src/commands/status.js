const chalk = require('chalk');
const { BASE_URL } = require('../lib/api');

async function handler() {
  console.log(`\n ${chalk.bold(' Estado del servidor Jandosoft')}\n`);

  console.log(`   ${chalk.dim('🌐 API URL:')} ${chalk.cyan(BASE_URL)}`);

  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/`, { method: 'HEAD' });
    const ms = Date.now() - start;
    const status = res.ok ? chalk.green('✓ Online') : chalk.yellow('⚠ Problemático');
    console.log(`   ${chalk.dim('📡 Estado:')}  ${status}`);
    console.log(`   ${chalk.dim('⚡ Latencia:')} ${ms}ms`);
    console.log(`   ${chalk.dim('🔢 Código:')}  ${res.status}`);
  } catch {
    const ms = Date.now() - start;
    console.log(`   ${chalk.dim('📡 Estado:')}  ${chalk.red('✖ Offline')}`);
    console.log(`   ${chalk.dim('⚡ Latencia:')} ${ms}ms`);
  }

  console.log('');
}

module.exports = { handler };
