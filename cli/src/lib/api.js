const chalk = require('chalk');
const config = require('./config');

const BASE_URL = 'https://jandosoft.vercel.app';

class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = config.get('token');
    if (!token) {
      throw new ApiError(401, 'No autenticado. Usa jandosoft login primero.');
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
      throw new ApiError(res.status, data.error || data.message || 'Desconocido', data);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, `No se pudo conectar con ${BASE_URL}: ${err.message}`);
  }
}

module.exports = { request, BASE_URL, ApiError };
