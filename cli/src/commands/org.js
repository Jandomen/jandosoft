const chalk = require('chalk');
const { request } = require('../lib/api');

async function handler() {
  const data = await request('GET', '/api/organization');
  const org = data.organization;

  console.log(`\n ${chalk.bold(' Organización')}\n`);

  console.log(`   ${chalk.dim('🆔 ID:')}     ${org.id || org._id}`);
  console.log(`   ${chalk.dim('🏢 Nombre:')} ${chalk.bold(org.name)}`);
  console.log(`   ${chalk.dim('🔗 Slug:')}   ${org.slug || '—'}`);

  if (org.members && org.members.length > 0) {
    console.log(`\n ${chalk.bold(` 👥 Miembros (${org.members.length})`)}\n`);
    for (const m of org.members) {
      const memberUser = m.user || m;
      console.log(`   ${chalk.red.bold('●')} ${memberUser.name || memberUser.email || '—'} ${chalk.dim(`(${m.role || 'member'})`)}`);
    }
  }

  console.log('');
}

module.exports = { handler };
