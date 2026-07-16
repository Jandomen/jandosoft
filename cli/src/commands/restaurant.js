const chalk = require('chalk');
const inquirer = require('inquirer').default;
const { request } = require('../lib/api');
const { selectStore } = require('../lib/store-picker');

const ORDER_STATUS = {
  pending: '⏳ Pendiente',
  preparing: '🔥 Preparando',
  ready: '✅ Listo',
  served: '🍽️ Servido',
  completed: '✔️ Completado',
  cancelled: '❌ Cancelado',
};

const STATUS_COLORS = {
  pending: chalk.yellow,
  preparing: chalk.hex('#FF6B35'),
  ready: chalk.green,
  served: chalk.blue,
  completed: chalk.dim,
  cancelled: chalk.red,
};

function statusLabel(status) {
  const color = STATUS_COLORS[status] || chalk.white;
  const label = ORDER_STATUS[status] || status;
  return color(label);
}

function divider() {
  return chalk.dim('─'.repeat(52));
}

async function fetchJson(method, path) {
  const data = await request(method, path);
  return data;
}

// ─── MENU ────────────────────────────────────────────────

async function showMenu(storeId) {
  const data = await fetchJson('GET', `/api/restaurant/${storeId}/menu`);
  const items = data.menu || data.items || data || [];

  console.log(`\n ${chalk.bold(`🍽️  Menú (${items.length} platos)`)}\n`);
  console.log(`   ${chalk.dim('Nombre')}  ${chalk.dim('Precio').padStart(10)}  ${chalk.dim('Categoría').padEnd(16)}  ${chalk.dim('Prep')}  ${chalk.dim('Cal')}`);
   console.log(`   ${divider()}`);

  if (items.length === 0) {
    console.log(`\n   ${chalk.yellow('Sin platos en el menú.')}\n`);
    return;
  }

  for (const item of items) {
    const name = item.name || '—';
    const price = `$${item.price || 0}`;
    const cat = item.category || '—';
    const prep = item.prepTime ? `${item.prepTime}m` : '—';
    const cal = item.calories ? `${item.cal}cal` : '—';
    console.log(`   ${chalk.cyan('•')} ${chalk.bold(name)}`);
    console.log(`     ${chalk.dim('Precio:')}  ${chalk.green(price)}  ${chalk.dim('•')}  ${chalk.dim('Cat:')} ${chalk.magenta(cat)}`);
    console.log(`     ${chalk.dim('Prep:')}    ${chalk.cyan(prep)}  ${chalk.dim('•')}  ${chalk.dim('Cal:')} ${chalk.cyan(cal)}`);
    if (item.dietary && item.dietary.length) {
      console.log(`     ${chalk.dim('Dieta:')}   ${item.dietary.map(d => chalk.green(d)).join(', ')}`);
    }
    console.log('');
  }
}

async function addMenuItem(storeId) {
  console.log(`\n ${chalk.bold('➕ Agregar plato al menú')}\n`);

  const answers = await inquirer.prompt([
    { type: 'input', name: 'name', message: 'Nombre del plato:', validate: v => v.trim() ? true : 'Requerido' },
    { type: 'input', name: 'description', message: 'Descripción:' },
    { type: 'number', name: 'price', message: 'Precio ($):', validate: v => v > 0 ? true : 'Debe ser mayor a 0' },
    { type: 'input', name: 'category', message: 'Categoría:', default: 'General' },
    { type: 'number', name: 'prepTime', message: 'Tiempo de preparación (min):' },
    { type: 'number', name: 'calories', message: 'Calorías:' },
    { type: 'input', name: 'dietary', message: 'Restricciones alimentarias (separar con coma):' },
    { type: 'input', name: 'imageUrl', message: 'URL de imagen (opcional):' },
  ]);

  const body = {
    name: answers.name.trim(),
    description: answers.description.trim() || undefined,
    price: answers.price,
    category: answers.category.trim() || 'General',
    prepTime: answers.prepTime || undefined,
    calories: answers.calories || undefined,
    dietary: answers.dietary ? answers.dietary.split(',').map(d => d.trim()).filter(Boolean) : [],
    imageUrl: answers.imageUrl.trim() || undefined,
  };

  console.log(`\n   ${chalk.dim('Guardando...')}`);
  try {
    const data = await request('POST', `/api/restaurant/${storeId}/menu`, body);
    console.log(`   ${chalk.green('✓')} ${chalk.bold('Plato agregado')} — ${chalk.cyan(body.name)} ($${body.price})\n`);
  } catch (err) {
    console.log(`\n   ${chalk.red.bold('✖')} ${err.message}\n`);
  }
}

async function menuLoop(storeId) {
  while (true) {
    const { option } = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: `${chalk.bold('🍽️  Menú')}`,
        choices: [
          { name: `  ${chalk.cyan('📋')}  ${chalk.bold('Ver menú')}`, value: 'list' },
          { name: `  ${chalk.cyan('➕')}  ${chalk.bold('Agregar plato')}`, value: 'add' },
          new inquirer.Separator(),
          { name: `  ${chalk.red('◆')}  ${chalk.bold('Volver')}`, value: '__back__' },
        ],
        pageSize: 8,
        prefix: '',
        loop: false,
      },
    ]);

    if (option === '__back__') return;
    if (option === 'list') await showMenu(storeId);
    if (option === 'add') await addMenuItem(storeId);

    if (option !== '__back__') {
      await inquirer.prompt([{ type: 'input', name: '_', message: `${chalk.dim('Presiona Enter para volver...')}`, prefix: '' }]);
    }
  }
}

// ─── ORDERS ──────────────────────────────────────────────

async function showOrders(storeId) {
  const data = await fetchJson('GET', `/api/restaurant/${storeId}/orders`);
  const orders = data.orders || data || [];

  console.log(`\n ${chalk.bold(`📑 Órdenes recientes (${orders.length})`)}\n`);

  if (orders.length === 0) {
    console.log(`   ${chalk.yellow('Sin órdenes recientes.')}\n`);
    return;
  }

  for (const o of orders.slice(0, 20)) {
    const id = (o._id || o.id || '').slice(-6);
    console.log(`   ${chalk.magenta('●')} ${chalk.bold(`#${id}`)}  ${statusLabel(o.status)}`);
    console.log(`     ${chalk.dim('Cliente:')}  ${o.customerName || o.customer || '—'}`);
    console.log(`     ${chalk.dim('Platos:')}   ${(o.items || []).map(i => i.name || i).join(', ') || '—'}`);
    console.log(`     ${chalk.dim('Total:')}    ${chalk.green('$' + (o.total || o.amount || 0))}`);
    if (o.createdAt) console.log(`     ${chalk.dim('Fecha:')}    ${new Date(o.createdAt).toLocaleString()}`);
    console.log('');
  }
}

async function updateOrderStatus(storeId) {
  const data = await fetchJson('GET', `/api/restaurant/${storeId}/orders`);
  const orders = (data.orders || data || []).filter(o => o.status !== 'completed' && o.status !== 'cancelled');

  if (orders.length === 0) {
    console.log(`\n   ${chalk.yellow('No hay órdenes activas para actualizar.')}\n`);
    return;
  }

  const { orderId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'orderId',
      message: `${chalk.bold('Selecciona una orden')}`,
      choices: orders.map(o => {
        const id = (o._id || o.id || '').slice(-6);
        return {
          name: `  ${chalk.magenta('#')}${chalk.bold(id)}  ${statusLabel(o.status)}  ${chalk.dim('$' + (o.total || 0))}`,
          value: o._id || o.id,
          short: `#${id}`,
        };
      }),
      pageSize: 10,
      prefix: '',
      loop: false,
    },
  ]);

  const { newStatus } = await inquirer.prompt([
    {
      type: 'list',
      name: 'newStatus',
      message: `${chalk.bold('Nuevo estado:')}`,
      choices: Object.keys(ORDER_STATUS).map(s => ({
        name: `  ${statusLabel(s)}`,
        value: s,
      })),
      pageSize: 8,
      prefix: '',
      loop: false,
    },
  ]);

  console.log(`   ${chalk.dim('Actualizando...')}`);
  try {
    await request('PATCH', `/api/restaurant/${storeId}/orders/${orderId}`, { status: newStatus });
    console.log(`   ${chalk.green('✓')} Orden ${chalk.bold('#' + orderId.slice(-6))} → ${statusLabel(newStatus)}\n`);
  } catch (err) {
    console.log(`\n   ${chalk.red.bold('✖')} ${err.message}\n`);
  }
}

async function ordersLoop(storeId) {
  while (true) {
    const { option } = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: `${chalk.bold('📑 Órdenes')}`,
        choices: [
          { name: `  ${chalk.cyan('📋')}  ${chalk.bold('Ver órdenes')}`, value: 'list' },
          { name: `  ${chalk.cyan('🔄')}  ${chalk.bold('Actualizar estado')}`, value: 'update' },
          new inquirer.Separator(),
          { name: `  ${chalk.red('◆')}  ${chalk.bold('Volver')}`, value: '__back__' },
        ],
        pageSize: 8,
        prefix: '',
        loop: false,
      },
    ]);

    if (option === '__back__') return;
    if (option === 'list') await showOrders(storeId);
    if (option === 'update') await updateOrderStatus(storeId);

    if (option !== '__back__') {
      await inquirer.prompt([{ type: 'input', name: '_', message: `${chalk.dim('Presiona Enter para volver...')}`, prefix: '' }]);
    }
  }
}

// ─── RESERVATIONS ────────────────────────────────────────

async function showReservations(storeId) {
  const data = await fetchJson('GET', `/api/restaurant/${storeId}/reservations`);
  const reservations = data.reservations || data || [];

  console.log(`\n ${chalk.bold(`📅 Reservaciones (${reservations.length})`)}\n`);

  if (reservations.length === 0) {
    console.log(`   ${chalk.yellow('Sin reservaciones próximas.')}\n`);
    return;
  }

  for (const r of reservations) {
    const dateStr = r.date ? new Date(r.date).toLocaleDateString() : '—';
    const timeStr = r.time || '—';
    console.log(`   ${chalk.blue('📅')} ${chalk.bold(r.customerName || '—')}`);
    console.log(`     ${chalk.dim('Teléfono:')}     ${r.phone || '—'}`);
    console.log(`     ${chalk.dim('Fecha:')}        ${chalk.cyan(dateStr)}  ${chalk.dim('a las')}  ${chalk.cyan(timeStr)}`);
    console.log(`     ${chalk.dim('Personas:')}     ${r.partySize || '—'}`);
    if (r.notes) console.log(`     ${chalk.dim('Notas:')}        ${r.notes}`);
    console.log('');
  }
}

async function addReservation(storeId) {
  console.log(`\n ${chalk.bold('➕ Nueva reservación')}\n`);

  const answers = await inquirer.prompt([
    { type: 'input', name: 'customerName', message: 'Nombre del cliente:', validate: v => v.trim() ? true : 'Requerido' },
    { type: 'input', name: 'phone', message: 'Teléfono:', validate: v => v.trim() ? true : 'Requerido' },
    { type: 'input', name: 'date', message: 'Fecha (YYYY-MM-DD):', validate: v => v.trim() ? true : 'Requerido' },
    { type: 'input', name: 'time', message: 'Hora (HH:MM):', validate: v => v.trim() ? true : 'Requerido' },
    { type: 'number', name: 'partySize', message: 'Tamaño del grupo:', default: 2, validate: v => v > 0 ? true : 'Debe ser mayor a 0' },
    { type: 'input', name: 'notes', message: 'Notas (opcional):' },
  ]);

  const body = {
    customerName: answers.customerName.trim(),
    phone: answers.phone.trim(),
    date: answers.date.trim(),
    time: answers.time.trim(),
    partySize: answers.partySize,
    notes: answers.notes.trim() || undefined,
  };

  console.log(`\n   ${chalk.dim('Guardando...')}`);
  try {
    await request('POST', `/api/restaurant/${storeId}/reservations`, body);
    console.log(`   ${chalk.green('✓')} ${chalk.bold('Reservación creada')} — ${chalk.cyan(body.customerName)} el ${body.date} a las ${body.time}\n`);
  } catch (err) {
    console.log(`\n   ${chalk.red.bold('✖')} ${err.message}\n`);
  }
}

async function reservationsLoop(storeId) {
  while (true) {
    const { option } = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: `${chalk.bold('📅 Reservaciones')}`,
        choices: [
          { name: `  ${chalk.cyan('📋')}  ${chalk.bold('Ver reservaciones')}`, value: 'list' },
          { name: `  ${chalk.cyan('➕')}  ${chalk.bold('Nueva reservación')}`, value: 'add' },
          new inquirer.Separator(),
          { name: `  ${chalk.red('◆')}  ${chalk.bold('Volver')}`, value: '__back__' },
        ],
        pageSize: 8,
        prefix: '',
        loop: false,
      },
    ]);

    if (option === '__back__') return;
    if (option === 'list') await showReservations(storeId);
    if (option === 'add') await addReservation(storeId);

    if (option !== '__back__') {
      await inquirer.prompt([{ type: 'input', name: '_', message: `${chalk.dim('Presiona Enter para volver...')}`, prefix: '' }]);
    }
  }
}

// ─── PROMOTIONS ──────────────────────────────────────────

async function showPromotions(storeId) {
  const data = await fetchJson('GET', `/api/restaurant/${storeId}/promotions`);
  const promos = data.promotions || data || [];

  console.log(`\n ${chalk.bold(`🏷️  Promociones (${promos.length})`)}\n`);

  if (promos.length === 0) {
    console.log(`   ${chalk.yellow('Sin promociones activas.')}\n`);
    return;
  }

  for (const p of promos) {
    const start = p.startDate ? new Date(p.startDate).toLocaleDateString() : '—';
    const end = p.endDate ? new Date(p.endDate).toLocaleDateString() : '—';
    console.log(`   ${chalk.yellow('🏷️')} ${chalk.bold(p.title || p.name || '—')}`);
    console.log(`     ${chalk.dim('Descripción:')} ${p.description || '—'}`);
    if (p.discount) console.log(`     ${chalk.dim('Descuento:')}  ${chalk.green(p.discount)}`);
    if (p.code) console.log(`     ${chalk.dim('Código:')}     ${chalk.cyan(p.code)}`);
    console.log(`     ${chalk.dim('Vigencia:')}   ${chalk.cyan(start)} ${chalk.dim('→')} ${chalk.cyan(end)}`);
    console.log('');
  }
}

// ─── LOYALTY ─────────────────────────────────────────────

async function showLoyalty(storeId) {
  const data = await fetchJson('GET', `/api/restaurant/${storeId}/loyalty`);
  const loyalty = data.loyalty || data || {};

  console.log(`\n ${chalk.bold('⭐ Programa de Lealtad')}\n`);

  if (!loyalty || Object.keys(loyalty).length === 0) {
    console.log(`   ${chalk.yellow('Información de lealtad no disponible.')}\n`);
    return;
  }

  if (loyalty.totalMembers !== undefined) {
    console.log(`   ${chalk.dim('👥 Miembros totales:')}    ${chalk.bold(loyalty.totalMembers)}`);
  }
  if (loyalty.activeMembers !== undefined) {
    console.log(`   ${chalk.dim('🟢 Miembros activos:')}    ${chalk.bold(loyalty.activeMembers)}`);
  }
  if (loyalty.totalPointsIssued !== undefined) {
    console.log(`   ${chalk.dim('⭐ Puntos emitidos:')}     ${chalk.bold(loyalty.totalPointsIssued)}`);
  }
  if (loyalty.totalPointsRedeemed !== undefined) {
    console.log(`   ${chalk.dim('🎁 Puntos canjeados:')}    ${chalk.bold(loyalty.totalPointsRedeemed)}`);
  }
  if (loyalty.tierDistribution) {
    console.log(`\n   ${chalk.bold('Distribución por nivel:')}`);
    for (const [tier, count] of Object.entries(loyalty.tierDistribution)) {
      console.log(`     ${chalk.magenta('●')} ${chalk.bold(tier)}: ${count}`);
    }
  }
  if (loyalty.recentActivity && loyalty.recentActivity.length > 0) {
    console.log(`\n   ${chalk.bold('Actividad reciente:')}`);
    for (const a of loyalty.recentActivity.slice(0, 5)) {
      const date = a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—';
      console.log(`     ${chalk.dim(date)}  ${a.customerName || a.customer || '—'}  ${chalk.green('+' + (a.points || 0))} pts`);
    }
  }
  console.log('');
}

// ─── REVIEWS ─────────────────────────────────────────────

async function showReviews(storeId) {
  const data = await fetchJson('GET', `/api/restaurant/${storeId}/reviews`);
  const reviews = data.reviews || data || [];

  console.log(`\n ${chalk.bold(`💬 Reseñas (${reviews.length})`)}\n`);

  if (reviews.length === 0) {
    console.log(`   ${chalk.yellow('Sin reseñas aún.')}\n`);
    return;
  }

  for (const r of reviews) {
    const stars = '⭐'.repeat(Math.min(r.rating || 0, 5));
    const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—';
    console.log(`   ${chalk.magenta('💬')} ${chalk.bold(r.customerName || 'Anónimo')}  ${chalk.dim(date)}`);
    console.log(`     ${stars}  ${chalk.dim(`${r.rating || 0}/5`)}`);
    console.log(`     ${r.comment || r.text || '—'}`);
    console.log('');
  }
}

// ─── WAITER CALLS ────────────────────────────────────────

async function showWaiterCalls(storeId) {
  const data = await fetchJson('GET', `/api/restaurant/${storeId}/waiter`);
  const calls = data.calls || data.waiterCalls || data || [];

  console.log(`\n ${chalk.bold(`🛎️  Llamadas de mesero (${calls.length})`)}\n`);

  if (calls.length === 0) {
    console.log(`   ${chalk.green('No hay llamadas pendientes.')}\n`);
    return;
  }

  for (const c of calls) {
    const date = c.createdAt ? new Date(c.createdAt).toLocaleString() : '—';
    const urgency = c.urgent || c.priority === 'high' ? chalk.red.bold(' !! URGENTE') : '';
    console.log(`   ${chalk.red('🔔')} ${chalk.bold('Mesa ' + (c.tableNumber || c.table || '—'))}${urgency}`);
    console.log(`     ${chalk.dim('Cliente:')}   ${c.customerName || '—'}`);
    console.log(`     ${chalk.dim('Mensaje:')}   ${c.message || c.note || '—'}`);
    console.log(`     ${chalk.dim('Hora:')}      ${date}`);
    if (c.status) console.log(`     ${chalk.dim('Estado:')}    ${c.status}`);
    console.log('');
  }
}

// ─── MAIN HANDLER ────────────────────────────────────────

async function handler(args) {
  let storeId = null;

  if (args && args.length > 0 && args[0] && !args[0].startsWith('-')) {
    storeId = args[0];
  }

  if (!storeId) {
    const store = await selectStore();
    if (!store || store === '__create__') {
      if (store === '__create__') {
        console.log(`\n   ${chalk.dim('Crea una empresa primero con')} ${chalk.cyan('jandosoft stores create')}\n`);
      }
      return;
    }
    storeId = store._id || store.id;
  }

  while (true) {
    const { option } = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: `${chalk.bold('🍜  Restaurant Management')}`,
        choices: [
          { name: `  ${chalk.cyan('🍽️')}  ${chalk.bold('Menú')}`, value: 'menu' },
          { name: `  ${chalk.cyan('📑')}  ${chalk.bold('Órdenes')}`, value: 'orders' },
          { name: `  ${chalk.cyan('📅')}  ${chalk.bold('Reservaciones')}`, value: 'reservations' },
          { name: `  ${chalk.cyan('🏷️')}   ${chalk.bold('Promociones')}`, value: 'promotions' },
          { name: `  ${chalk.cyan('⭐')}  ${chalk.bold('Lealtad')}`, value: 'loyalty' },
          { name: `  ${chalk.cyan('💬')}  ${chalk.bold('Reseñas')}`, value: 'reviews' },
          { name: `  ${chalk.cyan('🛎️')}   ${chalk.bold('Llamadas de mesero')}`, value: 'waiter' },
          new inquirer.Separator(),
          { name: `  ${chalk.red('◆')}  ${chalk.bold('Volver')}`, value: '__back__' },
        ],
        pageSize: 12,
        prefix: '',
        loop: false,
      },
    ]);

    if (option === '__back__') return;

    switch (option) {
      case 'menu':
        await menuLoop(storeId);
        break;
      case 'orders':
        await ordersLoop(storeId);
        break;
      case 'reservations':
        await reservationsLoop(storeId);
        break;
      case 'promotions':
        await showPromotions(storeId);
        break;
      case 'loyalty':
        await showLoyalty(storeId);
        break;
      case 'reviews':
        await showReviews(storeId);
        break;
      case 'waiter':
        await showWaiterCalls(storeId);
        break;
    }

    if (['promotions', 'loyalty', 'reviews', 'waiter'].includes(option)) {
      await inquirer.prompt([{ type: 'input', name: '_', message: `${chalk.dim('Presiona Enter para volver...')}`, prefix: '' }]);
    }
  }
}

module.exports = { handler };
