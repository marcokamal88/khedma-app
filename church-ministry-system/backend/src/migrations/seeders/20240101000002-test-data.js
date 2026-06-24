'use strict';
const bcrypt = require('bcrypt');

const IDS = {
  church: 1,
  users: { priest: 1, sector_leader: 2, servant: 3, parent: 4, served_member: 5 },
  members: { priest: 1, sector_leader: 2, servant: 3, parent: 4, served_member: 5 },
  service_year: 1,
  sector: 1,
  service: 1,
  stage_groups: { g1: 1, g2: 2, g3: 3 },
  class: 1,
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const now = new Date();
    const churchId = IDS.church;
    const u = IDS.users;
    const m = IDS.members;

    // ---- 1. Look up role IDs ----
    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('priest','sector_leader','servant','parent','served_member')`,
      { type: Sequelize.QueryTypes.SELECT },
    );
    const roleMap = {};
    for (const r of roles) roleMap[r.name] = r.id;

    // ---- Check if already seeded ----
    const existingChurch = await queryInterface.sequelize.query(
      `SELECT id FROM churches WHERE id = :id`,
      { replacements: { id: churchId }, type: Sequelize.QueryTypes.SELECT },
    );
    if (existingChurch.length > 0) {
      console.log('Test data already seeded, skipping.');
      return;
    }

    // ---- 2. Church ----
    await queryInterface.bulkInsert('churches', [{
      id: churchId,
      name: 'Test Church',
      subdomain: 'test',
      settings: JSON.stringify({ timezone: 'Africa/Cairo' }),
      is_active: true,
      created_at: now,
      updated_at: now,
    }]);

    // ---- 3. Users (one per role) ----
    const users = [
      { id: u.priest, email: 'priest@test.com', phone: '+201000000001', password_hash: passwordHash, full_name: 'Father Michael', avatar_url: null, created_at: now, updated_at: now },
      { id: u.sector_leader, email: 'leader@test.com', phone: '+201000000002', password_hash: passwordHash, full_name: 'Mina Girgis', avatar_url: null, created_at: now, updated_at: now },
      { id: u.servant, email: 'servant@test.com', phone: '+201000000003', password_hash: passwordHash, full_name: 'Peter Nabil', avatar_url: null, created_at: now, updated_at: now },
      { id: u.parent, email: 'parent@test.com', phone: '+201000000004', password_hash: passwordHash, full_name: 'Mariam Ayoub', avatar_url: null, created_at: now, updated_at: now },
      { id: u.served_member, email: 'member@test.com', phone: '+201000000005', password_hash: passwordHash, full_name: 'George Adel', avatar_url: null, created_at: now, updated_at: now },
    ];
    await queryInterface.bulkInsert('users', users);

    // ---- 4. Church Members ----
    const members = [
      { id: m.priest, church_id: churchId, user_id: u.priest, is_active: true, joined_at: now, created_at: now, updated_at: now },
      { id: m.sector_leader, church_id: churchId, user_id: u.sector_leader, is_active: true, joined_at: now, created_at: now, updated_at: now },
      { id: m.servant, church_id: churchId, user_id: u.servant, is_active: true, joined_at: now, created_at: now, updated_at: now },
      { id: m.parent, church_id: churchId, user_id: u.parent, is_active: true, joined_at: now, created_at: now, updated_at: now },
      { id: m.served_member, church_id: churchId, user_id: u.served_member, is_active: true, joined_at: now, created_at: now, updated_at: now },
    ];
    await queryInterface.bulkInsert('church_members', members);

    // ---- 5. Member Roles ----
    const memberRoles = [
      { church_member_id: m.priest, role_id: roleMap.priest, church_id: churchId, assigned_at: now },
      { church_member_id: m.sector_leader, role_id: roleMap.sector_leader, church_id: churchId, assigned_at: now },
      { church_member_id: m.servant, role_id: roleMap.servant, church_id: churchId, assigned_at: now },
      { church_member_id: m.parent, role_id: roleMap.parent, church_id: churchId, assigned_at: now },
      { church_member_id: m.served_member, role_id: roleMap.served_member, church_id: churchId, assigned_at: now },
    ];
    await queryInterface.bulkInsert('member_roles', memberRoles);

    // ---- 6. Service Year ----
    await queryInterface.bulkInsert('service_years', [{
      id: IDS.service_year,
      church_id: churchId,
      label: '2024-2025',
      start_date: '2024-09-01',
      end_date: '2025-08-31',
      is_current: true,
      created_at: now,
    }]);

    // ---- 7. Sector ----
    await queryInterface.bulkInsert('sectors', [{
      id: IDS.sector,
      church_id: churchId,
      name: 'Sunday School',
      type: 'general',
      description: 'Main Sunday School department',
      is_active: true,
      created_at: now,
      updated_at: now,
    }]);

    // ---- 8. Service ----
    await queryInterface.bulkInsert('services', [{
      id: IDS.service,
      church_id: churchId,
      sector_id: IDS.sector,
      name: 'Grade 7 Bible Study',
      schedule: JSON.stringify({ day: 'sunday', time: '09:00', frequency: 'weekly' }),
      is_active: true,
      created_at: now,
      updated_at: now,
    }]);

    // ---- 9. Stage Groups ----
    const sgs = IDS.stage_groups;
    await queryInterface.bulkInsert('stage_groups', [
      { id: sgs.g1, church_id: churchId, service_id: IDS.service, name: 'Grade 7', stage_order: 1, is_active: true },
      { id: sgs.g2, church_id: churchId, service_id: IDS.service, name: 'Grade 8', stage_order: 2, is_active: true },
      { id: sgs.g3, church_id: churchId, service_id: IDS.service, name: 'Grade 9', stage_order: 3, is_active: true },
    ]);

    // ---- 10. Class ----
    await queryInterface.bulkInsert('classes', [{
      id: IDS.class,
      church_id: churchId,
      service_id: IDS.service,
      stage_group_id: sgs.g1,
      name: 'Class A',
      capacity: 30,
      is_active: true,
    }]);

    // ---- 11. Servant Assignment ----
    await queryInterface.bulkInsert('servant_assignments', [{
      church_id: churchId,
      service_year_id: IDS.service_year,
      church_member_id: m.servant,
      service_id: IDS.service,
      class_id: IDS.class,
      is_active: true,
      assigned_at: now,
    }]);

    // ---- 12. Enrollments ----
    await queryInterface.bulkInsert('enrollments', [
      { church_id: churchId, service_year_id: IDS.service_year, church_member_id: m.served_member, service_id: IDS.service, class_id: IDS.class, stage_group_id: sgs.g1, enrolled_at: now, is_active: true },
      { church_id: churchId, service_year_id: IDS.service_year, church_member_id: m.servant, service_id: IDS.service, class_id: IDS.class, stage_group_id: sgs.g1, enrolled_at: now, is_active: true },
      { church_id: churchId, service_year_id: IDS.service_year, church_member_id: m.sector_leader, service_id: IDS.service, class_id: IDS.class, stage_group_id: sgs.g2, enrolled_at: now, is_active: true },
    ]);

    console.log('Test data seeded successfully');
    console.log('Login credentials (password: password123):');
    console.log('  priest@test.com    → priest');
    console.log('  leader@test.com    → sector_leader');
    console.log('  servant@test.com   → servant');
    console.log('  parent@test.com    → parent');
    console.log('  member@test.com    → served_member');
    console.log(`Church ID: ${churchId}`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'notifications', 'follow_up_activities', 'follow_ups', 'lesson_library',
      'activity_attendance', 'activity_enrollments', 'activities',
      'member_achievements', 'achievements',
      'payment_installments', 'event_registrations', 'events',
      'store_redemptions', 'store_items',
      'taio_transactions', 'task_assignments', 'tasks',
      'preparation_files', 'preparations',
      'attendance_records', 'attendance_sessions',
      'sibling_pairs', 'family_members', 'families',
      'servant_assignments', 'enrollments', 'classes', 'stage_groups',
      'services', 'sectors', 'service_years', 'member_roles',
      'church_members', 'users', 'churches',
    ];
    for (const table of tables) {
      try { await queryInterface.sequelize.query(`DELETE FROM ${table}`); } catch (e) { /* skip */ }
    }
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Test data rolled back');
  },
};
