const chalk = require('chalk');
const readline = require('readline');
const inquirer = require('inquirer').default;
const { request } = require('../lib/api');
const { selectStore } = require('../lib/store-picker');

const PLAN_LIMITS = { free: { maxStores: 3, maxProducts: 20 }, basic: { maxStores: 10, maxProducts: 100 }, enterprise: { maxStores: 999, maxProducts: 9999 } };

function showLimitWarnings(plan, productCount) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  let hasWarning = false;

  if (productCount >= limits.maxProducts) {
    console.log(`   ${chalk.red('🚫')} ${chalk.red.bold(`Límite de productos alcanzado (${productCount}/${limits.maxProducts})`)}`);
    console.log(`   ${chalk.dim('    Haz upgrade para agregar más productos.')}`);
    hasWarning = true;
  } else if (productCount >= limits.maxProducts * 0.8) {
    console.log(`   ${chalk.yellow('⚠️')} ${chalk.yellow(`Estás usando ${productCount}/${limits.maxProducts} productos — cerca del límite.`)}`);
    hasWarning = true;
  }

  return hasWarning;
}

async function showStoreDashboard(store) {
  const [userData] = await Promise.all([
    request('GET', '/api/auth/me').catch(() => ({ user: {} })),
  ]);
  const plan = (userData.user?.subscription || 'free').toLowerCase();

  while (true) {
    const full = await request('GET', `/api/stores/${store._id || store.id}`);
    const s = full.store || full;

    console.log(`\n ${chalk.bold(`🏪 ${s.name}`)}${s.slug ? chalk.dim(`  (${s.slug})`) : ''}`);
    console.log(`   ${chalk.dim(`Suscripción:`)} ${chalk.cyan(plan.toUpperCase())}  ${chalk.dim(`— ${PLAN_LIMITS[plan]?.maxProducts || 20} productos máx`)}`);
    showLimitWarnings(plan, (s.products || []).length);
    console.log('');

    const choices = [
      { name: `  ${chalk.cyan('📋')}  ${chalk.bold('Información')}`, value: 'info', short: 'Info' },
      { name: `  ${chalk.cyan('📦')}  ${chalk.bold('Productos')}     ${chalk.dim(`(${(s.products || []).length})`)}`, value: 'products', short: 'Productos' },
      { name: `  ${chalk.cyan('👥')}  ${chalk.bold('Clientes')}      ${chalk.dim(`(${(s.customers || []).length})`)}`, value: 'customers', short: 'Clientes' },
      { name: `  ${chalk.cyan('📑')}  ${chalk.bold('Órdenes')}       ${chalk.dim(`(${(s.orders || []).length})`)}`, value: 'orders', short: 'Ordenes' },
      { name: `  ${chalk.cyan('🔧')}  ${chalk.bold('Servicios')}     ${chalk.dim(`(${(s.services || []).length})`)}`, value: 'services', short: 'Servicios' },
      { name: `  ${chalk.cyan('📊')}  ${chalk.bold('Analíticas')}`, value: 'analytics', short: 'Analytics' },
      new inquirer.Separator(),
      { name: `  ${chalk.red('◆')}  ${chalk.bold('Volver a tiendas')}`, value: '__back__', short: 'Volver' },
    ];

    const { option } = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: `${chalk.bold(`Dashboard — ${s.name}`)}`,
        choices,
        pageSize: 10,
        prefix: '',
        loop: false,
      },
    ]);

    if (option === '__back__') return;

    switch (option) {
      case 'info':
        showStoreInfo(s, plan);
        break;
      case 'products':
        showProducts(s.products || []);
        break;
      case 'customers':
        showCustomers(s.customers || []);
        break;
      case 'orders':
        showOrders(s.orders || []);
        break;
      case 'services':
        showServices(s.services || []);
        break;
      case 'analytics':
        await showAnalytics(s);
        break;
    }

    await inquirer.prompt([{ type: 'input', name: '_', message: `${chalk.dim('Presiona Enter para volver al dashboard...')}`, prefix: '' }]);
  }
}

function showStoreInfo(s, plan) {
  console.log(`\n ${chalk.bold('📋 Información de la tienda')}\n`);
  console.log(`   ${chalk.dim('🏪 Nombre:')}     ${chalk.bold(s.name)}`);
  console.log(`   ${chalk.dim('🔗 Slug:')}      ${s.slug || '—'}`);
  console.log(`   ${chalk.dim('📝 Descripción:')} ${s.desc || '—'}`);
  console.log(`   ${chalk.dim('🏭 Industria:')}  ${s.industry || '—'}`);
  console.log(`   ${chalk.dim('📂 Tipo:')}       ${s.type || '—'} ${s.typeLabel ? chalk.dim(`(${s.typeLabel})`) : ''}`);
  console.log(`   ${chalk.dim('🌐 URL:')}       ${chalk.cyan(`https://jandosoft.vercel.app/s/${s.slug}`)}`);
  console.log(`   ${chalk.dim('📅 Creado:')}    ${s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}`);
  console.log(`   ${chalk.dim('💳 Plan:')}       ${chalk.cyan(plan.toUpperCase())}  ${chalk.dim(`(máx ${PLAN_LIMITS[plan]?.maxProducts || 20} productos)`)}`);
  console.log(`   ${chalk.dim('📦 Productos:')}  ${(s.products || []).length} / ${PLAN_LIMITS[plan]?.maxProducts || 20}`);
  console.log(`   ${chalk.dim('👥 Clientes:')}   ${(s.customers || []).length}`);
  console.log(`   ${chalk.dim('📑 Órdenes:')}    ${(s.orders || []).length}`);
  console.log(`   ${chalk.dim('🔧 Servicios:')}  ${(s.services || []).length}`);
  console.log(`   ${chalk.dim('💳 Stripe:')}     ${s.paymentsEnabled ? chalk.green('✓ Activo') : chalk.yellow('✖ No configurado')}`);
  console.log(`   ${chalk.dim('🔒 Estado:')}     ${s.isSuspended ? chalk.red('Suspendido') : chalk.green('Activo')}`);
  if (s.isSuspended) {
    console.log(`   ${chalk.dim('⚠ Razón:')}      ${s.suspensionReason || '—'}`);
    if (s.suspendedUntil) console.log(`   ${chalk.dim('⏳ Hasta:')}      ${new Date(s.suspendedUntil).toLocaleDateString()}`);
  }
  showLimitWarnings(plan, (s.products || []).length);
}

function showProducts(products) {
  console.log(`\n ${chalk.bold(`📦 Productos (${products.length})`)}\n`);
  if (products.length === 0) {
    console.log(`   ${chalk.yellow('Sin productos.')} Agrega desde el panel web.\n`);
    return;
  }
  for (const p of products) {
    const stockColor = p.stock > 0 ? chalk.green : chalk.red;
    console.log(`   ${chalk.cyan('●')} ${chalk.bold(p.name)}`);
    console.log(`     ${chalk.dim('Precio:')}  $${p.price}`);
    console.log(`     ${chalk.dim('Stock:')}   ${stockColor(p.stock)}`);
    console.log('');
  }
}

function showCustomers(customers) {
  console.log(`\n ${chalk.bold(`👥 Clientes (${customers.length})`)}\n`);
  if (customers.length === 0) {
    console.log(`   ${chalk.yellow('Sin clientes registrados.')}\n`);
    return;
  }
  for (const c of customers) {
    console.log(`   ${chalk.green('●')} ${chalk.bold(c.name)}`);
    console.log(`     ${chalk.dim('Email:')} ${c.email || '—'}`);
    console.log(`     ${chalk.dim('Tel:')}   ${c.phone || '—'}`);
    console.log('');
  }
}

function showOrders(orders) {
  console.log(`\n ${chalk.bold(`📑 Órdenes (${orders.length})`)}\n`);
  if (orders.length === 0) {
    console.log(`   ${chalk.yellow('Sin órdenes.')}\n`);
    return;
  }
  for (const o of orders) {
    const statusColor =
      o.status === 'Completado' ? chalk.green :
      o.status === 'Pendiente' ? chalk.yellow :
      o.status === 'Cancelado' ? chalk.red : chalk.white;
    console.log(`   ${chalk.magenta('●')} ${chalk.bold(o.product)}`);
    console.log(`     ${chalk.dim('Monto:')}  $${o.amount}`);
    console.log(`     ${chalk.dim('Estado:')} ${statusColor(o.status)}`);
    console.log('');
  }
}

function showServices(services) {
  console.log(`\n ${chalk.bold(`🔧 Servicios (${services.length})`)}\n`);
  if (services.length === 0) {
    console.log(`   ${chalk.yellow('Sin servicios.')}\n`);
    return;
  }
  for (const sv of services) {
    console.log(`   ${chalk.blue('●')} ${chalk.bold(sv.name)}`);
    console.log(`     ${chalk.dim('Desc:')}   ${sv.desc || '—'}`);
    console.log(`     ${chalk.dim('Precio:')} $${sv.price}`);
    console.log('');
  }
}

async function showAnalytics(store) {
  const storeId = store._id || store.id;
  try {
    const data = await request('GET', `/api/analytics/${storeId}`);
    console.log(`\n ${chalk.bold(`📊 Analíticas — ${store.name}`)}\n`);
    console.log(`   ${chalk.dim('👁 Total visitas:')}     ${chalk.bold(data.totalViews || 0)}`);
    console.log(`   ${chalk.dim('👤 Visitantes únicos:')} ${chalk.bold(data.uniqueVisitors || 0)}`);
    console.log(`   ${chalk.dim('📅 Visitas hoy:')}       ${chalk.bold(data.viewsToday || 0)}`);
    if (data.dailyBreakdown && data.dailyBreakdown.length > 0) {
      console.log(`\n   ${chalk.bold('Últimos 7 días:')}`);
      for (const d of data.dailyBreakdown) {
        console.log(`   ${chalk.dim(d.date)}  ${'█'.repeat(Math.min(d.views, 30))} ${d.views} (${d.uniqueVisitors} visitantes)`);
      }
    }
    if (data.topPages && data.topPages.length > 0) {
      console.log(`\n   ${chalk.bold('Páginas top:')}`);
      for (const p of data.topPages) {
        console.log(`   ${chalk.dim(p._id)}  ${p.views} visitas`);
      }
    }
    console.log('');
  } catch {
    console.log(` ${chalk.yellow(' Analíticas no disponibles para esta tienda.')}\n`);
  }
}

async function handler(args) {
  const subcmd = args[0];

  if (subcmd === 'create') return await createStore(args.slice(1));

  while (true) {
    const store = await selectStore();
    if (store === null) break;
    if (store === '__create__') {
      await createStore([]);
      continue;
    }
    await showStoreDashboard(store);
  }
}

async function createStore(args) {
  let name = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' || args[i] === '-n') name = args[i + 1];
  }

  if (!name) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    name = await new Promise((resolve) => {
      rl.question(` ${chalk.cyan('‣ Nombre de la tienda:')} `, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  if (!name) {
    console.log(` ${chalk.red('✖ El nombre es requerido')}\n`);
    return;
  }

  console.log(` ${chalk.dim(` Creando tienda "${name}"...`)}`);

  const data = await request('POST', '/api/stores', { name });
  const store = data.store || data;

  console.log(`\n ${chalk.green.bold('✓ Tienda creada exitosamente')}`);
  console.log(`   ${chalk.dim('🏪 Nombre:')} ${chalk.bold(store.name)}`);
  console.log(`   ${chalk.dim('🔗 Slug:')}   ${store.slug}`);
  console.log(`   ${chalk.dim('🌐 URL:')}    ${chalk.cyan(`https://jandosoft.vercel.app/s/${store.slug}`)}\n`);
}

module.exports = { handler };
