const chalk = require('chalk');
const config = require('./config');

const BASE_URL = 'https://jandosoft.vercel.app';

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = config.get('token');
    if (!token) {
      console.log(`\n${chalk.red.bold(' ✖ No autenticado.')} Usa ${chalk.cyan('jandosoft login')} primero.\n`);
      process.exit(1);
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${path}`;
  const options = { method, headers };

  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
      console.log(`\n${chalk.red.bold(' ✖ Error')} ${res.status}: ${data.error || data.message || 'Desconocido'}\n`);
      process.exit(1);
    }

    return data;
  } catch (err) {
    console.log(`\n${chalk.red.bold(' ✖ Error de conexión')} No se pudo conectar con ${chalk.cyan(BASE_URL)}`);
    console.log(`${chalk.dim(err.message)}\n`);
    process.exit(1);
  }
}

module.exports = { request, BASE_URL };
