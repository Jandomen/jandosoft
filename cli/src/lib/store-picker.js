const chalk = require('chalk');
const inquirer = require('inquirer').default;
const { request } = require('./api');

async function selectStore() {
  let data;
  try {
    data = await request('GET', '/api/stores');
  } catch {
    return null;
  }
  const stores = data.stores || [];

  if (stores.length === 0) {
    console.log(` ${chalk.yellow(' No tienes empresas aún.')}\n`);
    return null;
  }

  const choices = stores.map((s) => ({
    name: `  ${chalk.green('🏪')} ${chalk.bold(s.name)}${s.slug ? chalk.dim(` (${s.slug})`) : ''}`,
    value: s._id || s.id,
    short: s.name,
    store: s,
  }));

  choices.push(new inquirer.Separator());
  choices.push({ name: `  ${chalk.cyan('＋')}  ${chalk.bold('Crear nueva empresa')}`, value: '__create__', short: 'Crear' });
  choices.push({ name: `  ${chalk.red('◆')}  ${chalk.bold('Volver')}`, value: '__back__', short: 'Volver' });

  const { storeId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'storeId',
      message: `${chalk.bold('Selecciona una empresa')}`,
      choices,
      pageSize: 12,
      prefix: '',
      loop: false,
    },
  ]);

  if (storeId === '__back__') return null;
  if (storeId === '__create__') return '__create__';

  const store = stores.find((s) => (s._id || s.id) === storeId);
  return store;
}

module.exports = { selectStore };
