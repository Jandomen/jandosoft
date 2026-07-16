const chalk = require('chalk');
const inquirer = require('inquirer').default;
const { request } = require('../lib/api');
const { selectStore } = require('../lib/store-picker');

const STATUS_ICONS = { waiting: '⏳', in_progress: '✂️', completed: '✅', cancelled: '❌' };

const STATUS_COLORS = {
  waiting: chalk.yellow,
  in_progress: chalk.blue,
  completed: chalk.green,
  cancelled: chalk.red,
};

function formatSchedule(schedule) {
  if (!schedule) return chalk.dim('Not set');
  if (typeof schedule === 'string') return schedule;
  const days = schedule.days || [];
  const open = schedule.open || '';
  const close = schedule.close || '';
  return `${days.join(', ')} ${open}-${close}`;
}

function divider(char = '─', len = 60) {
  return chalk.dim(char.repeat(len));
}

function header(title) {
  console.log();
  console.log(chalk.bold.cyan(`  ═══ ${title} ═══`));
  console.log(divider());
}

async function showBarbers(storeId) {
  header('Barbers');
  const res = await request('GET', `/api/barbershop/${storeId}/barbers`);
  const barbers = res.data || res.barbers || res || [];

  if (!Array.isArray(barbers) || barbers.length === 0) {
    console.log(chalk.dim('  No barbers registered yet.'));
  } else {
    barbers.forEach((b, i) => {
      const active = b.active !== false ? chalk.green('● Active') : chalk.red('○ Inactive');
      console.log(`  ${chalk.bold.white(`${i + 1}.`)} ${chalk.bold(b.name)}`);
      console.log(`     ${chalk.dim('Specialty:')} ${b.specialty || chalk.dim('N/A')}`);
      console.log(`     ${chalk.dim('Schedule:')} ${formatSchedule(b.schedule)}`);
      console.log(`     ${chalk.dim('Status:')}    ${active}`);
      if (b.photoUrl) console.log(`     ${chalk.dim('Photo:')}    ${b.photoUrl}`);
      console.log(divider('·', 50));
    });
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Barber options:',
      choices: [
        { name: '➕ Add new barber', value: 'add' },
        { name: '↩ Back', value: 'back' },
      ],
    },
  ]);

  if (action === 'add') await addBarber(storeId);
}

async function addBarber(storeId) {
  header('Add New Barber');
  const answers = await inquirer.prompt([
    { type: 'input', name: 'name', message: 'Barber name:', validate: (v) => (v.trim() ? true : 'Name is required') },
    { type: 'input', name: 'specialty', message: 'Specialty (e.g. Fades, Beard Trim):', validate: (v) => (v.trim() ? true : 'Specialty is required') },
    { type: 'input', name: 'days', message: 'Working days (comma-separated):', default: 'Mon, Tue, Wed, Thu, Fri, Sat' },
    { type: 'input', name: 'open', message: 'Opening time:', default: '09:00' },
    { type: 'input', name: 'close', message: 'Closing time:', default: '18:00' },
    { type: 'input', name: 'photoUrl', message: 'Photo URL (optional):' },
  ]);

  const barber = {
    name: answers.name.trim(),
    specialty: answers.specialty.trim(),
    schedule: {
      days: answers.days.split(',').map((d) => d.trim()),
      open: answers.open.trim(),
      close: answers.close.trim(),
    },
    photoUrl: answers.photoUrl.trim() || undefined,
    active: true,
  };

  await request('POST', `/api/barbershop/${storeId}/barbers`, barber);
  console.log(chalk.green(`  ✓ Barber "${barber.name}" added successfully!`));
}

async function showQueue(storeId) {
  header('Current Queue');
  const res = await request('GET', `/api/barbershop/${storeId}/queue`);
  const entries = res.data || res.queue || res || [];

  if (!Array.isArray(entries) || entries.length === 0) {
    console.log(chalk.dim('  Queue is empty.'));
  } else {
    console.log(
      `  ${chalk.bold.white('#')}  ${chalk.bold('Customer')}     ${chalk.bold('Service')}           ${chalk.bold('Barber')}      ${chalk.bold('Status')}`
    );
    console.log(divider());
    entries.forEach((e, i) => {
      const icon = STATUS_ICONS[e.status] || '?';
      const color = STATUS_COLORS[e.status] || chalk.white;
      console.log(
        `  ${chalk.dim(`${i + 1}.`)}  ${(e.customerName || 'Walk-in').padEnd(14)} ${(e.serviceRequested || '').padEnd(18)} ${(e.preferredBarber || 'Any').padEnd(13)} ${color(`${icon} ${e.status}`)}`
      );
      if (e.phone) console.log(`      ${chalk.dim('Phone:')} ${e.phone}`);
    });
    console.log(divider());
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Queue options:',
      choices: [
        { name: '➕ Add walk-in to queue', value: 'add' },
        { name: '🔄 Update entry status', value: 'update' },
        { name: '❌ Remove entry', value: 'remove' },
        { name: '↩ Back', value: 'back' },
      ],
    },
  ]);

  if (action === 'add') await addToQueue(storeId);
  else if (action === 'update') await updateQueueStatus(storeId, entries);
  else if (action === 'remove') await removeFromQueue(storeId, entries);
}

async function addToQueue(storeId) {
  header('Add Walk-in to Queue');
  const res = await request('GET', `/api/barbershop/${storeId}/barbers`);
  const barbers = res.data || res.barbers || res || [];
  const barberChoices = [{ name: 'Any available', value: '' }, ...barbers.map((b) => ({ name: b.name, value: b._id || b.name }))];

  const answers = await inquirer.prompt([
    { type: 'input', name: 'customerName', message: 'Customer name:', validate: (v) => (v.trim() ? true : 'Name is required') },
    { type: 'input', name: 'phone', message: 'Phone number:' },
    { type: 'input', name: 'serviceRequested', message: 'Service requested:', validate: (v) => (v.trim() ? true : 'Service is required') },
    { type: 'list', name: 'preferredBarber', message: 'Preferred barber:', choices: barberChoices },
  ]);

  const entry = {
    customerName: answers.customerName.trim(),
    phone: answers.phone.trim() || undefined,
    serviceRequested: answers.serviceRequested.trim(),
    preferredBarber: answers.preferredBarber || undefined,
    status: 'waiting',
  };

  await request('POST', `/api/barbershop/${storeId}/queue`, entry);
  console.log(chalk.green(`  ✓ ${entry.customerName} added to queue!`));
}

async function updateQueueStatus(storeId, entries) {
  if (!entries || entries.length === 0) {
    console.log(chalk.dim('  No entries to update.'));
    return;
  }

  header('Update Queue Entry Status');
  const { entryId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'entryId',
      message: 'Select entry to update:',
      choices: entries.map((e, i) => ({
        name: `${STATUS_ICONS[e.status]} ${e.customerName} — ${e.serviceRequested}`,
        value: e._id || i,
      })),
    },
  ]);

  const { newStatus } = await inquirer.prompt([
    {
      type: 'list',
      name: 'newStatus',
      message: 'New status:',
      choices: [
        { name: '⏳ Waiting', value: 'waiting' },
        { name: '✂️  In Progress', value: 'in_progress' },
        { name: '✅ Completed', value: 'completed' },
        { name: '❌ Cancelled', value: 'cancelled' },
      ],
    },
  ]);

  await request('PATCH', `/api/barbershop/${storeId}/queue/${entryId}`, { status: newStatus });
  console.log(chalk.green(`  ✓ Status updated to "${newStatus}"!`));
}

async function removeFromQueue(storeId, entries) {
  if (!entries || entries.length === 0) {
    console.log(chalk.dim('  No entries to remove.'));
    return;
  }

  header('Remove from Queue');
  const { entryId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'entryId',
      message: 'Select entry to remove:',
      choices: entries.map((e, i) => ({
        name: `${STATUS_ICONS[e.status]} ${e.customerName} — ${e.serviceRequested}`,
        value: e._id || i,
      })),
    },
  ]);

  const { confirm } = await inquirer.prompt([
    { type: 'confirm', name: 'confirm', message: 'Are you sure you want to remove this entry?', default: false },
  ]);

  if (confirm) {
    await request('DELETE', `/api/barbershop/${storeId}/queue/${entryId}`);
    console.log(chalk.green('  ✓ Entry removed from queue.'));
  } else {
    console.log(chalk.dim('  Cancelled.'));
  }
}

async function showHistory(storeId) {
  header('Service History');
  const res = await request('GET', `/api/barbershop/${storeId}/history`);
  const records = res.data || res.history || res || [];

  if (!Array.isArray(records) || records.length === 0) {
    console.log(chalk.dim('  No service records yet.'));
  } else {
    records.forEach((r, i) => {
      const stars = r.rating ? '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) : chalk.dim('No rating');
      console.log(`  ${chalk.bold.white(`${i + 1}.`)} ${chalk.bold(r.barberName || 'Unknown')} → ${chalk.white(r.customerName || 'Customer')}`);
      console.log(`     ${chalk.dim('Service:')} ${r.service || 'N/A'}    ${chalk.dim('Price:')} ${chalk.green(r.price != null ? `$${r.price}` : 'N/A')}`);
      console.log(`     ${chalk.dim('Rating:')} ${chalk.yellow(stars)}`);
      if (r.date) console.log(`     ${chalk.dim('Date:')}   ${new Date(r.date).toLocaleDateString()}`);
      if (r.notes) console.log(`     ${chalk.dim('Notes:')}  ${r.notes}`);
      console.log(divider('·', 50));
    });
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'History options:',
      choices: [
        { name: '➕ Add service record', value: 'add' },
        { name: '↩ Back', value: 'back' },
      ],
    },
  ]);

  if (action === 'add') await addHistory(storeId);
}

async function addHistory(storeId) {
  header('Add Service Record');

  const barberRes = await request('GET', `/api/barbershop/${storeId}/barbers`);
  const barbers = barberRes.data || barberRes.barbers || barberRes || [];
  const barberChoices = barbers.map((b) => ({ name: b.name, value: b._id || b.name }));

  if (barberChoices.length === 0) {
    console.log(chalk.yellow('  No barbers found. Add a barber first.'));
    return;
  }

  const answers = await inquirer.prompt([
    { type: 'list', name: 'barberId', message: 'Barber:', choices: barberChoices },
    { type: 'input', name: 'barberName', message: 'Barber name (for display):' },
    { type: 'input', name: 'customerName', message: 'Customer name:', validate: (v) => (v.trim() ? true : 'Customer name is required') },
    { type: 'input', name: 'service', message: 'Service performed:', validate: (v) => (v.trim() ? true : 'Service is required') },
    { type: 'number', name: 'price', message: 'Price ($):', validate: (v) => (v >= 0 ? true : 'Price must be non-negative') },
    {
      type: 'list',
      name: 'rating',
      message: 'Rating:',
      choices: [
        { name: '★★★★★ (5)', value: 5 },
        { name: '★★★★☆ (4)', value: 4 },
        { name: '★★★☆☆ (3)', value: 3 },
        { name: '★★☆☆☆ (2)', value: 2 },
        { name: '★☆☆☆☆ (1)', value: 1 },
      ],
    },
    { type: 'input', name: 'notes', message: 'Notes (optional):' },
  ]);

  const record = {
    barberId: answers.barberId,
    barberName: answers.barberName.trim() || barbers.find((b) => (b._id || b.name) === answers.barberId)?.name || 'Unknown',
    customerName: answers.customerName.trim(),
    service: answers.service.trim(),
    price: answers.price,
    rating: answers.rating,
    notes: answers.notes.trim() || undefined,
    date: new Date().toISOString(),
  };

  await request('POST', `/api/barbershop/${storeId}/history`, record);
  console.log(chalk.green('  ✓ Service record added!'));
}

async function handler(args) {
  const storeId = args[0] || (await selectStore())?._id;
  if (!storeId) {
    console.log(chalk.red('  No store selected. Aborting.'));
    return;
  }

  let running = true;
  while (running) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `Barbershop Management ${chalk.dim(`(Store: ${storeId})`)}`,
        choices: [
          { name: '💈  Barbers', value: 'barbers' },
          { name: '📋  Queue', value: 'queue' },
          { name: '📜  Service History', value: 'history' },
          { name: '↩ Back', value: 'back' },
        ],
      },
    ]);

    if (action === 'back') {
      running = false;
    } else if (action === 'barbers') {
      await showBarbers(storeId);
    } else if (action === 'queue') {
      await showQueue(storeId);
    } else if (action === 'history') {
      await showHistory(storeId);
    }
  }
}

module.exports = { handler };
