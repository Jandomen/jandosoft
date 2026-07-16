const chalk = require('chalk');
const inquirer = require('inquirer').default;
const { request } = require('../lib/api');

const TYPE_ICONS = {
  automation: '⚡',
  system: '🤖',
  alert: '⚠️',
  info: 'ℹ️',
  order: '📦',
  appointment: '📅',
  customer: '👤',
  payment: '💳',
  invoice: '📑',
};

const TYPE_LABELS = {
  automation: 'Automatización',
  system: 'Sistema',
  alert: 'Alerta',
  info: 'Información',
  order: 'Pedido',
  appointment: 'Cita',
  customer: 'Cliente',
  payment: 'Pago',
  invoice: 'Factura',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
}

function getIcon(type) {
  return TYPE_ICONS[type] || '🔔';
}

function getTypeLabel(type) {
  return TYPE_LABELS[type] || type || 'General';
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

async function fetchNotifications() {
  console.log(` ${chalk.dim('Cargando notificaciones...')}`);
  try {
    const data = await request('GET', '/api/notifications?limit=50');
    return data.notifications || data.data || [];
  } catch (err) {
    console.log(` ${chalk.red('✖')} Error al cargar notificaciones: ${err.message}\n`);
    return [];
  }
}

function showNotifications(notifications, unreadCount) {
  console.clear();
  console.log('');

  const unreadBadge = unreadCount > 0
    ? chalk.bgRed.white.bold(` ${unreadCount} sin leer `)
    : chalk.bgGreen.white.bold(' Todo leído ');

  console.log(` ${chalk.bold.cyan('🔔 Notificaciones')}  ${unreadBadge}`);
  console.log(chalk.dim(' ─'.repeat(30)));
  console.log('');

  if (notifications.length === 0) {
    console.log(`   ${chalk.dim('No hay notificaciones.')}\n`);
    return;
  }

  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    const icon = getIcon(n.type);
    const label = getTypeLabel(n.type);
    const isUnread = !n.read && !n.isRead;
    const time = timeAgo(n.createdAt || n.date);
    const title = n.title || n.message || n.text || '(sin título)';
    const body = n.body || n.description || n.content || '';
    const hasLink = !!(n.link || n.url);

    const prefix = isUnread ? chalk.blue('●') : chalk.dim('○');
    const titleStyle = isUnread ? chalk.bold.white : chalk.dim;
    const bodyStyle = isUnread ? chalk.white : chalk.dim;
    const badge = isUnread ? chalk.bgBlue.white(' nuevo ') : '';

    console.log(`   ${prefix} ${icon}  ${titleStyle(truncate(title, 60))}  ${badge}`);
    if (body) {
      console.log(`     ${bodyStyle(truncate(body, 72))}`);
    }
    const meta = [];
    if (label) meta.push(chalk.dim(label));
    if (time) meta.push(chalk.dim(time));
    if (hasLink) meta.push(chalk.cyan('🔗 enlace'));
    if (meta.length) console.log(`       ${meta.join(chalk.dim(' · '))}`);
    console.log('');
  }
}

async function markRead(id) {
  try {
    await request('PATCH', '/api/notifications', { notificationId: id });
    return true;
  } catch (err) {
    console.log(` ${chalk.red('✖')} Error al marcar como leída: ${err.message}\n`);
    return false;
  }
}

async function markAllRead() {
  try {
    await request('PATCH', '/api/notifications', { markAllRead: true });
    return true;
  } catch (err) {
    console.log(` ${chalk.red('✖')} Error al marcar todas: ${err.message}\n`);
    return false;
  }
}

function showNotificationDetail(n) {
  const icon = getIcon(n.type);
  const label = getTypeLabel(n.type);
  const title = n.title || n.message || n.text || '(sin título)';
  const body = n.body || n.description || n.content || '';
  const time = n.createdAt || n.date ? new Date(n.createdAt || n.date).toLocaleString() : '';
  const isUnread = !n.read && !n.isRead;

  console.log('');
  console.log(` ${chalk.bold('─'.repeat(40))}`);
  console.log(`  ${icon}  ${chalk.bold.cyan(title)}`);
  if (isUnread) console.log(`  ${chalk.bgBlue.white(' nuevo ')}`);
  console.log(` ${chalk.dim('─'.repeat(40))}`);
  console.log(`  ${chalk.dim('Tipo:')}   ${label}`);
  if (time) console.log(`  ${chalk.dim('Fecha:')}  ${time}`);
  console.log('');
  if (body) {
    console.log(`  ${body}`);
    console.log('');
  }
  const link = n.link || n.url;
  if (link) {
    console.log(`  ${chalk.cyan('🔗')} ${chalk.cyan.underline(link)}`);
    console.log('');
  }
  console.log(` ${chalk.dim('─'.repeat(40))}`);
  console.log('');
}

async function handler(args) {
  console.log(`\n ${chalk.bold('🔔 Notificaciones')}\n`);

  let notifications = await fetchNotifications();
  let unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;

  while (true) {
    showNotifications(notifications, unreadCount);

    const choices = [];

    if (notifications.length > 0) {
      const unreadItems = notifications.filter((n) => !n.read && !n.isRead);
      if (unreadItems.length > 0) {
        choices.push({
          name: `  ${chalk.green('✓')} ${chalk.bold('Marcar todas como leídas')} ${chalk.dim(`(${unreadItems.length})`)}`,
          value: '__mark_all__',
          short: 'Marcar todas',
        });
      }
      choices.push(new inquirer.Separator());
      for (let i = 0; i < notifications.length; i++) {
        const n = notifications[i];
        const icon = getIcon(n.type);
        const title = n.title || n.message || n.text || '(sin título)';
        const isUnread = !n.read && !n.isRead;
        const bullet = isUnread ? chalk.blue('●') : chalk.dim('○');
        const style = isUnread ? chalk.bold : chalk.dim;
        choices.push({
          name: `  ${bullet} ${icon}  ${style(truncate(title, 55))}`,
          value: i,
          short: title,
        });
      }
    }

    choices.push(new inquirer.Separator());
    choices.push({
      name: `  ${chalk.yellow('↻')} ${chalk.bold('Actualizar')}`,
      value: '__refresh__',
      short: 'Actualizar',
    });
    choices.push({
      name: `  ${chalk.red('◆')} ${chalk.bold('Volver')}`,
      value: '__back__',
      short: 'Volver',
    });

    const { selection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message: `${chalk.bold(' Notificaciones')} ${chalk.dim(`(${unreadCount} sin leer)`)}`,
        choices,
        pageSize: 16,
        prefix: '',
        loop: false,
      },
    ]);

    if (selection === '__back__') break;

    if (selection === '__refresh__') {
      notifications = await fetchNotifications();
      unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;
      continue;
    }

    if (selection === '__mark_all__') {
      const ok = await markAllRead();
      if (ok) {
        console.log(` ${chalk.green('✓')} Todas marcadas como leídas\n`);
        notifications = await fetchNotifications();
        unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;
      }
      continue;
    }

    const n = notifications[selection];
    showNotificationDetail(n);

    const detailChoices = [];
    if (!n.read && !n.isRead) {
      detailChoices.push({
        name: `  ${chalk.green('✓')} ${chalk.bold('Marcar como leída')}`,
        value: 'mark_read',
        short: 'Marcar leída',
      });
    }
    const link = n.link || n.url;
    if (link) {
      detailChoices.push({
        name: `  ${chalk.cyan('🔗')} ${chalk.bold('Abrir enlace')}`,
        value: 'open_link',
        short: 'Abrir enlace',
      });
    }
    detailChoices.push({
      name: `  ${chalk.red('◆')} ${chalk.bold('Volver')}`,
      value: 'back',
      short: 'Volver',
    });

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `${chalk.bold('Acción')}`,
        choices: detailChoices,
        prefix: '',
        loop: false,
      },
    ]);

    if (action === 'mark_read') {
      const ok = await markRead(n._id || n.id);
      if (ok) {
        console.log(` ${chalk.green('✓')} Marcada como leída\n`);
        notifications = await fetchNotifications();
        unreadCount = notifications.filter((n2) => !n2.read && !n2.isRead).length;
      }
    }

    if (action === 'open_link' && link) {
      console.log(`\n ${chalk.cyan('🔗')} ${chalk.underline(link)}\n`);
      await inquirer.prompt([
        {
          type: 'input',
          name: '_',
          message: `${chalk.dim('Presiona Enter para volver...')}`,
          prefix: '',
        },
      ]);
    }
  }
}

module.exports = { handler };
