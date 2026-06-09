const chalk = require('chalk');
const { request } = require('../lib/api');

async function handler() {
  const data = await request('GET', '/api/auth/me');

  const user = data.user;
  const org = data.organization;

  console.log(`\n ${chalk.bold(' Perfil de Usuario')}\n`);
  console.log(`   ${chalk.dim('👤 Nombre:')}       ${user.name || '—'}`);
  console.log(`   ${chalk.dim('📧 Email:')}        ${user.email}`);
  console.log(`   ${chalk.dim('📞 Teléfono:')}     ${user.phone || '—'}`);
  console.log(`   ${chalk.dim('🔑 Rol:')}          ${user.role || '—'}`);
  console.log(`   ${chalk.dim('💳 Suscripción:')}  ${user.subscription || '—'}`);
  console.log(`   ${chalk.dim('📅 Vence:')}        ${user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString() : '—'}`);
  console.log(`   ${chalk.dim('⚡ Estado:')}       ${user.isSuspended ? chalk.red('Suspendido') : chalk.green('Activo')}`);

  if (org) {
    console.log(`\n ${chalk.bold(' Organización')}\n`);
    console.log(`   ${chalk.dim('🆔 ID:')}    ${org.id || org._id}`);
    console.log(`   ${chalk.dim('🏢 Nombre:')}  ${org.name}`);
    console.log(`   ${chalk.dim('🔗 Slug:')}   ${org.slug || '—'}`);
    if (org.members) {
      console.log(`   ${chalk.dim('👥 Miembros:')} ${org.members.length}`);
    }
  }

  console.log('');
}

module.exports = { handler };
