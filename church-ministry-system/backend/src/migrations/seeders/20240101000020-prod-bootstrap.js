'use strict';

const bcrypt = require('bcrypt');

const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

const ROLES = [
  { name: 'priest', label: 'Priest' },
  { name: 'sector_leader', label: 'Sector Leader' },
  { name: 'service_leader', label: 'Service Leader' },
  { name: 'assistant_service_leader', label: 'Assistant Service Leader' },
  { name: 'class_leader', label: 'Class Leader' },
  { name: 'servant', label: 'Servant' },
  { name: 'served_member', label: 'Served Member' },
  { name: 'parent', label: 'Parent' },
];

const norm = (value) => String(value == null ? '' : value).trim().toLowerCase();

const list = (value, fallback) => {
  const raw = value ? String(value).split(',') : fallback;
  return raw.map((item) => String(item).trim()).filter(Boolean);
};

async function selectOne(queryInterface, Sequelize, sql, replacements) {
  const rows = await queryInterface.sequelize.query(sql, {
    replacements,
    type: Sequelize.QueryTypes.SELECT,
  });
  return rows[0] || null;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const q = queryInterface.sequelize;

    // Roles (idempotent, so the bootstrap does not depend on the roles seeder).
    let roles = await q.query('SELECT id, name FROM roles', { type: Sequelize.QueryTypes.SELECT });
    const missingRoles = ROLES.filter((role) => !roles.some((row) => row.name === role.name));
    if (missingRoles.length > 0) {
      await queryInterface.bulkInsert('roles', missingRoles);
      roles = await q.query('SELECT id, name FROM roles', { type: Sequelize.QueryTypes.SELECT });
    }
    const roleMap = {};
    for (const role of roles) roleMap[role.name] = role.id;

    // Church (mobile app sends X-Church-ID: 1).
    const subdomain = norm(process.env.BOOTSTRAP_CHURCH_SUBDOMAIN || 'khedma');
    let church = await selectOne(
      queryInterface,
      Sequelize,
      'SELECT id, name, subdomain FROM churches WHERE subdomain = :subdomain LIMIT 1',
      { subdomain },
    );

    if (!church) {
      const churchOne = await selectOne(
        queryInterface,
        Sequelize,
        'SELECT id, name, subdomain FROM churches WHERE id = 1 LIMIT 1',
        {},
      );
      if (churchOne) {
        throw new Error(
          `Church id 1 already exists with subdomain "${churchOne.subdomain}". ` +
          `The mobile app expects church id 1; set BOOTSTRAP_CHURCH_SUBDOMAIN to that church or use an empty database.`,
        );
      }

      await queryInterface.bulkInsert('churches', [{
        id: 1,
        name: process.env.BOOTSTRAP_CHURCH_NAME || 'Khedma Church',
        subdomain,
        settings: JSON.stringify({ timezone: 'Africa/Cairo' }),
        is_active: true,
        created_at: now,
        updated_at: now,
      }]);
      church = { id: 1, name: process.env.BOOTSTRAP_CHURCH_NAME || 'Khedma Church', subdomain };
    }

    const churchId = Number(church.id);
    if (churchId !== 1) {
      console.warn(`[bootstrap] church id is ${churchId}, but the mobile app hardcodes X-Church-ID: 1`);
    }

    // Current service year.
    const currentYear = new Date().getFullYear();
    const yearLabel = process.env.BOOTSTRAP_YEAR_LABEL || `${currentYear}-${currentYear + 1}`;
    const yearStart = process.env.BOOTSTRAP_YEAR_START || `${currentYear}-09-01`;
    const yearEnd = process.env.BOOTSTRAP_YEAR_END || `${currentYear + 1}-08-31`;

    let serviceYear = await selectOne(
      queryInterface,
      Sequelize,
      'SELECT id, label, is_current FROM service_years WHERE church_id = :churchId AND label = :label LIMIT 1',
      { churchId, label: yearLabel },
    );

    if (!serviceYear) {
      await q.query('UPDATE service_years SET is_current = 0 WHERE church_id = :churchId', {
        replacements: { churchId },
      });
      await queryInterface.bulkInsert('service_years', [{
        church_id: churchId,
        label: yearLabel,
        start_date: yearStart,
        end_date: yearEnd,
        is_current: true,
        created_at: now,
      }]);
      serviceYear = await selectOne(
        queryInterface,
        Sequelize,
        'SELECT id, label, is_current FROM service_years WHERE church_id = :churchId AND label = :label LIMIT 1',
        { churchId, label: yearLabel },
      );
    } else if (!serviceYear.is_current) {
      await q.query('UPDATE service_years SET is_current = 0 WHERE church_id = :churchId', {
        replacements: { churchId },
      });
      await q.query('UPDATE service_years SET is_current = 1 WHERE id = :id', {
        replacements: { id: serviceYear.id },
      });
      serviceYear.is_current = 1;
    }

    // Sector + service + stage group + classes.
    const sectorName = process.env.BOOTSTRAP_SECTOR_NAME || 'Sunday School';
    let sector = await selectOne(
      queryInterface,
      Sequelize,
      'SELECT id, name FROM sectors WHERE church_id = :churchId AND name = :name LIMIT 1',
      { churchId, name: sectorName },
    );
    if (!sector) {
      await queryInterface.bulkInsert('sectors', [{
        church_id: churchId,
        name: sectorName,
        type: 'general',
        description: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      }]);
      sector = await selectOne(
        queryInterface,
        Sequelize,
        'SELECT id, name FROM sectors WHERE church_id = :churchId AND name = :name LIMIT 1',
        { churchId, name: sectorName },
      );
    }

    const serviceName = process.env.BOOTSTRAP_SERVICE_NAME || 'Main Service';
    let service = await selectOne(
      queryInterface,
      Sequelize,
      'SELECT id, name FROM services WHERE church_id = :churchId AND sector_id = :sectorId AND name = :name LIMIT 1',
      { churchId, sectorId: sector.id, name: serviceName },
    );
    if (!service) {
      await queryInterface.bulkInsert('services', [{
        church_id: churchId,
        sector_id: sector.id,
        name: serviceName,
        schedule: JSON.stringify({ day: 'sunday', time: '09:00', frequency: 'weekly' }),
        is_active: true,
        created_at: now,
        updated_at: now,
      }]);
      service = await selectOne(
        queryInterface,
        Sequelize,
        'SELECT id, name FROM services WHERE church_id = :churchId AND sector_id = :sectorId AND name = :name LIMIT 1',
        { churchId, sectorId: sector.id, name: serviceName },
      );
    }

    const stageGroupNames = list(process.env.BOOTSTRAP_STAGE_GROUPS, ['Stage 1']);
    const stageGroups = [];
    for (let index = 0; index < stageGroupNames.length; index += 1) {
      const name = stageGroupNames[index];
      let stageGroup = await selectOne(
        queryInterface,
        Sequelize,
        'SELECT id, name FROM stage_groups WHERE church_id = :churchId AND service_id = :serviceId AND name = :name LIMIT 1',
        { churchId, serviceId: service.id, name },
      );
      if (!stageGroup) {
        await queryInterface.bulkInsert('stage_groups', [{
          church_id: churchId,
          service_id: service.id,
          name,
          stage_order: index + 1,
          is_active: true,
        }]);
        stageGroup = await selectOne(
          queryInterface,
          Sequelize,
          'SELECT id, name FROM stage_groups WHERE church_id = :churchId AND service_id = :serviceId AND name = :name LIMIT 1',
          { churchId, serviceId: service.id, name },
        );
      }
      stageGroups.push(stageGroup);
    }

    const classNames = list(process.env.BOOTSTRAP_CLASSES, ['Class A']);
    const classes = [];
    for (const name of classNames) {
      let cls = await selectOne(
        queryInterface,
        Sequelize,
        'SELECT id, name FROM classes WHERE church_id = :churchId AND service_id = :serviceId AND name = :name LIMIT 1',
        { churchId, serviceId: service.id, name },
      );
      if (!cls) {
        await queryInterface.bulkInsert('classes', [{
          church_id: churchId,
          service_id: service.id,
          stage_group_id: stageGroups[0] ? stageGroups[0].id : null,
          name,
          capacity: null,
          is_active: true,
        }]);
        cls = await selectOne(
          queryInterface,
          Sequelize,
          'SELECT id, name FROM classes WHERE church_id = :churchId AND service_id = :serviceId AND name = :name LIMIT 1',
          { churchId, serviceId: service.id, name },
        );
      }
      classes.push(cls);
    }

    // People with usernames (stored in users.email).
    const sharedPassword = process.env.BOOTSTRAP_PASSWORD;
    const people = [
      {
        key: 'PRIEST',
        username: process.env.BOOTSTRAP_PRIEST_USERNAME || 'father',
        fullName: process.env.BOOTSTRAP_PRIEST_NAME || 'Father',
        phone: process.env.BOOTSTRAP_PRIEST_PHONE || null,
        role: 'priest',
      },
      {
        key: 'SECTOR_LEADER',
        username: process.env.BOOTSTRAP_SECTOR_LEADER_USERNAME || 'sector.leader',
        fullName: process.env.BOOTSTRAP_SECTOR_LEADER_NAME || 'Sector Leader',
        phone: process.env.BOOTSTRAP_SECTOR_LEADER_PHONE || null,
        role: 'sector_leader',
      },
      {
        key: 'SERVICE_LEADER',
        username: process.env.BOOTSTRAP_SERVICE_LEADER_USERNAME || 'service.leader',
        fullName: process.env.BOOTSTRAP_SERVICE_LEADER_NAME || 'Service Leader',
        phone: process.env.BOOTSTRAP_SERVICE_LEADER_PHONE || null,
        role: 'service_leader',
      },
    ];

    const created = {};

    for (const person of people) {
      const username = norm(person.username);
      if (!USERNAME_PATTERN.test(username)) {
        throw new Error(`Invalid username "${username}" for ${person.key}. Use 3-30 chars: a-z 0-9 . _ -`);
      }

      const password = process.env[`BOOTSTRAP_${person.key}_PASSWORD`] || sharedPassword;
      if (!password) {
        throw new Error(
          `Missing BOOTSTRAP_${person.key}_PASSWORD (or BOOTSTRAP_PASSWORD). ` +
          `Refusing to create "${username}" without an explicit password.`,
        );
      }

      let user = await selectOne(
        queryInterface,
        Sequelize,
        'SELECT id, email, full_name FROM users WHERE email = :username LIMIT 1',
        { username },
      );
      if (!user) {
        const passwordHash = await bcrypt.hash(password, 10);
        await queryInterface.bulkInsert('users', [{
          email: username,
          phone: person.phone,
          password_hash: passwordHash,
          full_name: person.fullName,
          avatar_url: null,
          created_at: now,
          updated_at: now,
        }]);
        user = await selectOne(
          queryInterface,
          Sequelize,
          'SELECT id, email, full_name FROM users WHERE email = :username LIMIT 1',
          { username },
        );
      }

      let member = await selectOne(
        queryInterface,
        Sequelize,
        'SELECT id FROM church_members WHERE church_id = :churchId AND user_id = :userId LIMIT 1',
        { churchId, userId: user.id },
      );
      if (!member) {
        await queryInterface.bulkInsert('church_members', [{
          church_id: churchId,
          user_id: user.id,
          is_active: true,
          joined_at: now,
          created_at: now,
          updated_at: now,
        }]);
        member = await selectOne(
          queryInterface,
          Sequelize,
          'SELECT id FROM church_members WHERE church_id = :churchId AND user_id = :userId LIMIT 1',
          { churchId, userId: user.id },
        );
      }

      const profile = await selectOne(
        queryInterface,
        Sequelize,
        'SELECT id FROM member_profiles WHERE church_member_id = :memberId LIMIT 1',
        { memberId: member.id },
      );
      if (!profile) {
        await queryInterface.bulkInsert('member_profiles', [{
          church_id: churchId,
          church_member_id: member.id,
          phones: person.phone ? JSON.stringify([person.phone]) : null,
          created_at: now,
          updated_at: now,
        }]);
      }

      const roleId = roleMap[person.role];
      const memberRole = await selectOne(
        queryInterface,
        Sequelize,
        'SELECT id FROM member_roles WHERE church_member_id = :memberId AND role_id = :roleId LIMIT 1',
        { memberId: member.id, roleId },
      );
      if (!memberRole) {
        await queryInterface.bulkInsert('member_roles', [{
          church_member_id: member.id,
          role_id: roleId,
          church_id: churchId,
          assigned_at: now,
        }]);
      }

      created[person.role] = { username, memberId: Number(member.id) };
    }

    // Sector leader -> sector assignment.
    const sectorAssignment = await selectOne(
      queryInterface,
      Sequelize,
      'SELECT id FROM sector_assignments WHERE church_member_id = :memberId AND sector_id = :sectorId LIMIT 1',
      { memberId: created.sector_leader.memberId, sectorId: sector.id },
    );
    if (!sectorAssignment) {
      await queryInterface.bulkInsert('sector_assignments', [{
        church_member_id: created.sector_leader.memberId,
        sector_id: sector.id,
        church_id: churchId,
        is_active: true,
        assigned_at: now,
      }]);
    }

    // Service leader -> service assignment (no class), so a service context resolves at login.
    const serviceAssignment = await selectOne(
      queryInterface,
      Sequelize,
      'SELECT id, leader_role FROM servant_assignments WHERE church_member_id = :memberId AND service_id = :serviceId AND service_year_id = :serviceYearId LIMIT 1',
      {
        memberId: created.service_leader.memberId,
        serviceId: service.id,
        serviceYearId: serviceYear.id,
      },
    );
    if (!serviceAssignment) {
      await queryInterface.bulkInsert('servant_assignments', [{
        church_id: churchId,
        service_year_id: serviceYear.id,
        church_member_id: created.service_leader.memberId,
        service_id: service.id,
        class_id: null,
        leader_role: 'service_leader',
        is_active: true,
        assigned_at: now,
      }]);
    } else if (serviceAssignment.leader_role !== 'service_leader') {
      await q.query(
        'UPDATE servant_assignments SET leader_role = :role WHERE id = :id',
        { replacements: { role: 'service_leader', id: serviceAssignment.id } },
      );
    }

    console.log('[bootstrap] church:', `${church.name} (#${churchId})`, '| subdomain:', subdomain);
    console.log('[bootstrap] service year:', yearLabel, '| sector:', sectorName, '| service:', serviceName);
    console.log('[bootstrap] classes:', classes.map((cls) => cls.name).join(', '));
    for (const role of ['priest', 'sector_leader', 'service_leader']) {
      console.log(`[bootstrap] ${role}: ${created[role].username}`);
    }
    console.log('[bootstrap] passwords: from BOOTSTRAP_*_PASSWORD or BOOTSTRAP_PASSWORD (not printed)');
  },

  down: async () => {
    throw new Error('prod-bootstrap seeder is not reversible; drop the database instead.');
  },
};
