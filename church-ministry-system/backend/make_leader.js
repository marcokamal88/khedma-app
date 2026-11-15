const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

async function run() {
  const isProduction = process.env.NODE_ENV === 'production';
  const config = {
    host: isProduction ? process.env.AIVEN_DB_HOST : (process.env.DB_HOST || 'localhost'),
    port: isProduction ? parseInt(process.env.AIVEN_DB_PORT || '3306', 10) : parseInt(process.env.DB_PORT || '3306', 10),
    database: isProduction ? process.env.AIVEN_DB_NAME : (process.env.DB_NAME || 'khedma_app'),
    user: isProduction ? process.env.AIVEN_DB_USER : (process.env.DB_USER || 'root'),
    password: isProduction ? process.env.AIVEN_DB_PASS : (process.env.DB_PASS || ''),
    connectTimeout: 2000,
  };

  console.log(`Connecting to database ${config.database} on ${config.host}:${config.port}...`);
  let connection;
  try {
    connection = await mysql.createConnection(config);
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    // try fallback to Aiven if local failed
    if (!isProduction && process.env.AIVEN_DB_HOST) {
      console.log('Attempting fallback to Aiven database...');
      connection = await mysql.createConnection({
        host: process.env.AIVEN_DB_HOST,
        port: parseInt(process.env.AIVEN_DB_PORT || '3306', 10),
        database: process.env.AIVEN_DB_NAME,
        user: process.env.AIVEN_DB_USER,
        password: process.env.AIVEN_DB_PASS,
        ssl: { rejectUnauthorized: false }
      });
    } else {
      throw err;
    }
  }

  // 1. Find user with email/username 'leader'
  const [users] = await connection.execute(
    'SELECT id, full_name, email, phone FROM users WHERE email = ? OR email LIKE ?',
    ['leader', '%leader%']
  );

  console.log('Found users:', users);
  if (users.length === 0) {
    console.log('No user found matching "leader".');
    await connection.end();
    return;
  }

  const targetUser = users.find(u => u.email === 'leader') || users[0];
  console.log(`Target user: ${targetUser.full_name} (ID: ${targetUser.id}, email: ${targetUser.email})`);

  // 2. Find ChurchMember
  const [members] = await connection.execute(
    'SELECT id, church_id, user_id, is_active FROM church_members WHERE user_id = ?',
    [targetUser.id]
  );
  console.log('Church members:', members);
  if (members.length === 0) {
    console.log('No church member found for this user.');
    await connection.end();
    return;
  }
  const member = members[0];

  // 3. Check role 'sector_leader'
  const [roles] = await connection.execute('SELECT id, name FROM roles WHERE name = ?', ['sector_leader']);
  let sectorLeaderRoleId;
  if (roles.length === 0) {
    const [res] = await connection.execute('INSERT INTO roles (name, description) VALUES (?, ?)', ['sector_leader', 'Sector Leader']);
    sectorLeaderRoleId = res.insertId;
    console.log('Created sector_leader role with ID:', sectorLeaderRoleId);
  } else {
    sectorLeaderRoleId = roles[0].id;
    console.log('sector_leader role ID:', sectorLeaderRoleId);
  }

  // 4. Ensure member_roles has sector_leader
  const [existingMR] = await connection.execute(
    'SELECT * FROM member_roles WHERE church_member_id = ? AND role_id = ?',
    [member.id, sectorLeaderRoleId]
  );
  if (existingMR.length === 0) {
    await connection.execute(
      'INSERT INTO member_roles (church_member_id, role_id) VALUES (?, ?)',
      [member.id, sectorLeaderRoleId]
    );
    console.log('Added sector_leader role to member_roles.');
  } else {
    console.log('User already has sector_leader in member_roles.');
  }

  // 5. Find sectors in the church
  const [sectors] = await connection.execute(
    'SELECT id, church_id, name FROM sectors WHERE church_id = ?',
    [member.church_id]
  );
  console.log('Available sectors in church:', sectors);

  let targetSectorId;
  if (sectors.length > 0) {
    targetSectorId = sectors[0].id;
  } else {
    // create a default sector if none exists
    const [secRes] = await connection.execute(
      'INSERT INTO sectors (church_id, name, description) VALUES (?, ?, ?)',
      [member.church_id, 'قطاع ابتدائي', 'قطاع ابتدائي']
    );
    targetSectorId = secRes.insertId;
    console.log('Created default sector ID:', targetSectorId);
  }

  // 6. Check sector_assignments
  // Check schema of sector_assignments table
  const [cols] = await connection.execute('SHOW COLUMNS FROM sector_assignments');
  console.log('sector_assignments columns:', cols.map(c => c.Field));

  const [existingSA] = await connection.execute(
    'SELECT * FROM sector_assignments WHERE church_member_id = ? AND sector_id = ?',
    [member.id, targetSectorId]
  );

  if (existingSA.length === 0) {
    // Find active service year if required
    const hasServiceYearCol = cols.some(c => c.Field === 'service_year_id');
    let serviceYearId = null;
    if (hasServiceYearCol) {
      const [years] = await connection.execute(
        'SELECT id FROM service_years WHERE church_id = ? AND is_active = 1',
        [member.church_id]
      );
      if (years.length > 0) serviceYearId = years[0].id;
    }

    const hasChurchIdCol = cols.some(c => c.Field === 'church_id');
    const colsToInsert = ['church_member_id', 'sector_id', 'is_active'];
    const valuesToInsert = [member.id, targetSectorId, 1];
    if (hasChurchIdCol) {
      colsToInsert.push('church_id');
      valuesToInsert.push(member.church_id);
    }
    if (hasServiceYearCol && serviceYearId) {
      colsToInsert.push('service_year_id');
      valuesToInsert.push(serviceYearId);
    }
    const placeholders = colsToInsert.map(() => '?').join(', ');
    await connection.execute(
      `INSERT INTO sector_assignments (${colsToInsert.join(', ')}) VALUES (${placeholders})`,
      valuesToInsert
    );
    console.log(`Assigned member ${member.id} to sector ${targetSectorId} in sector_assignments.`);
  } else {
    await connection.execute(
      'UPDATE sector_assignments SET is_active = 1 WHERE church_member_id = ? AND sector_id = ?',
      [member.id, targetSectorId]
    );
    console.log('Activated existing sector assignment.');
  }

  // 7. Check services under this sector
  const [services] = await connection.execute(
    'SELECT id, name, sector_id FROM services WHERE sector_id = ?',
    [targetSectorId]
  );
  console.log(`Services under sector ${targetSectorId}:`, services);

  console.log('\nSUCCESS! User "leader" is now configured as sector_leader for sector:', targetSectorId);
  await connection.end();
}

run().catch(console.error);
