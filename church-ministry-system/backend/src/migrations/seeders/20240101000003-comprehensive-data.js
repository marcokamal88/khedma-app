'use strict';

const bcrypt = require('bcrypt');

const churchId = 1;
const syId = 1;
const EXISTING = {
  users: { priest: 1, sector_leader: 2, servant: 3, parent: 4, served_member: 5 },
  members: { priest: 1, sector_leader: 2, servant: 3, parent: 4, served_member: 5 },
  sector: 1,
  service: 1,
  stage_groups: [1, 2, 3],
  class: 1,
};

const N = {
  su: { sl: 6, asl: 7, cl: 8, s2: 9, s3: 10, m2: 11, m3: 12, ch: 13 },
  sm: { sl: 6, asl: 7, cl: 8, s2: 9, s3: 10, m2: 11, m3: 12, ch: 13 },
  sv2: 2, sv3: 3,
  cb: 2, cc: 3,
  sg4: 4, sg5: 5,
  ses: [1, 2, 3, 4, 5],
  tk: [1, 2, 3, 4, 5],
  ev: [1, 2],
  fam: 1,
  si: [1, 2, 3],
  ls: [1, 2, 3, 4, 5],
  ac: [1, 2, 3],
  ach: [1, 2, 3, 4, 5],
  fu: [1, 2, 3],
};

const u = EXISTING.users;
const m = EXISTING.members;
const nu = N.su;
const nm = N.sm;

function ago(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const safeInsert = async (qi, table, rows) => {
  if (!Array.isArray(rows)) rows = [rows];
  for (const row of rows) {
    try { await qi.bulkInsert(table, [row]); } catch (e) { /* skip duplicates */ }
  }
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const pw = await bcrypt.hash('password123', 10);
    const now = new Date();
    const roles = await queryInterface.sequelize.query('SELECT id, name FROM roles', { type: Sequelize.QueryTypes.SELECT });
    const roleMap = {};
    for (const r of roles) roleMap[r.name] = r.id;

    // ── 0. Base church data (safe insert = skip if exists) ──
    await safeInsert(queryInterface, 'churches', { id: churchId, name: 'Test Church', subdomain: 'test', settings: JSON.stringify({ timezone: 'Africa/Cairo' }), is_active: true, created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'service_years', { id: syId, church_id: churchId, label: '2024-2025', start_date: '2024-09-01', end_date: '2025-08-31', is_current: true, created_at: now });
    await safeInsert(queryInterface, 'sectors', { id: EXISTING.sector, church_id: churchId, name: 'Sunday School', type: 'general', description: 'Main Sunday School department', is_active: true, created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'services', { id: EXISTING.service, church_id: churchId, sector_id: EXISTING.sector, name: 'Grade 7 Bible Study', schedule: JSON.stringify({ day: 'sunday', time: '09:00', frequency: 'weekly' }), is_active: true, created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'stage_groups', { id: EXISTING.stage_groups[0], church_id: churchId, service_id: EXISTING.service, name: 'Stage 1', stage_order: 1, is_active: true });
    await safeInsert(queryInterface, 'stage_groups', { id: EXISTING.stage_groups[1], church_id: churchId, service_id: EXISTING.service, name: 'Stage 2', stage_order: 2, is_active: true });
    await safeInsert(queryInterface, 'stage_groups', { id: EXISTING.stage_groups[2], church_id: churchId, service_id: EXISTING.service, name: 'Stage 3', stage_order: 3, is_active: true });
    await safeInsert(queryInterface, 'classes', { id: EXISTING.class, church_id: churchId, service_id: EXISTING.service, stage_group_id: EXISTING.stage_groups[0], name: 'Class A', capacity: 30, is_active: true });
    const baseUsers = [
      { id: u.priest, email: 'priest@test.com', phone: '+201000000001', password_hash: pw, full_name: 'Father Michael', avatar_url: null },
      { id: u.sector_leader, email: 'leader@test.com', phone: '+201000000002', password_hash: pw, full_name: 'Mina Girgis', avatar_url: null },
      { id: u.servant, email: 'servant@test.com', phone: '+201000000003', password_hash: pw, full_name: 'Peter Nabil', avatar_url: null },
      { id: u.parent, email: 'parent@test.com', phone: '+201000000004', password_hash: pw, full_name: 'Mariam Ayoub', avatar_url: null },
      { id: u.served_member, email: 'member@test.com', phone: '+201000000005', password_hash: pw, full_name: 'George Adel', avatar_url: null },
    ];
    for (const usr of baseUsers) await safeInsert(queryInterface, 'users', { ...usr, created_at: now, updated_at: now });
    for (const bm of [{ id: m.priest, church_id: churchId, user_id: u.priest }, { id: m.sector_leader, church_id: churchId, user_id: u.sector_leader }, { id: m.servant, church_id: churchId, user_id: u.servant }, { id: m.parent, church_id: churchId, user_id: u.parent }, { id: m.served_member, church_id: churchId, user_id: u.served_member }]) {
      await safeInsert(queryInterface, 'church_members', { ...bm, is_active: true, joined_at: now, created_at: now, updated_at: now });
    }
    await safeInsert(queryInterface, 'servant_assignments', { church_id: churchId, service_year_id: syId, church_member_id: m.servant, service_id: EXISTING.service, class_id: EXISTING.class, is_active: true, assigned_at: now });
    for (const enroll of [
      { church_member_id: m.served_member, service_id: EXISTING.service, class_id: EXISTING.class, stage_group_id: EXISTING.stage_groups[0] },
      { church_member_id: m.servant, service_id: EXISTING.service, class_id: EXISTING.class, stage_group_id: EXISTING.stage_groups[0] },
      { church_member_id: m.sector_leader, service_id: EXISTING.service, class_id: EXISTING.class, stage_group_id: EXISTING.stage_groups[1] },
    ]) {
      await safeInsert(queryInterface, 'enrollments', { church_id: churchId, service_year_id: syId, ...enroll, enrolled_at: now, is_active: true });
    }

    // ── 1. Extra users & members ──
    const allNewUids = Object.values(nu);
    const existingUsers = await queryInterface.sequelize.query(`SELECT id FROM users WHERE id IN (:ids)`, { replacements: { ids: allNewUids }, type: Sequelize.QueryTypes.SELECT });
    const existU = new Set(existingUsers.map(r => r.id));
    const userSpecs = [
      [nu.sl, 'serviceleader@test.com', '+201000000011', 'Karim Bishoy'],
      [nu.asl, 'asstleader@test.com', '+201000000012', 'Mina Nabil'],
      [nu.cl, 'classleader@test.com', '+201000000013', 'Amir Youssef'],
      [nu.s2, 'servant2@test.com', '+201000000014', 'Bishoy Kamel'],
      [nu.s3, 'servant3@test.com', '+201000000015', 'Micheal Adel'],
      [nu.m2, 'member2@test.com', '+201000000016', 'Mina Malak'],
      [nu.m3, 'member3@test.com', '+201000000017', 'Youssef Sidhom'],
      [nu.ch, 'child@test.com', '+201000000018', 'Peter Adel'],
    ];
    for (const [id, email, phone, name] of userSpecs) {
      if (existU.has(id)) continue;
      await safeInsert(queryInterface, 'users', { id, email, phone, password_hash: pw, full_name: name, avatar_url: null, created_at: now, updated_at: now });
    }

    const allNewMids = Object.values(nm);
    const existingMembers = await queryInterface.sequelize.query(`SELECT id FROM church_members WHERE id IN (:ids)`, { replacements: { ids: allNewMids }, type: Sequelize.QueryTypes.SELECT });
    const existM = new Set(existingMembers.map(r => r.id));
    const memberSpecs = [
      [nm.sl, nu.sl], [nm.asl, nu.asl], [nm.cl, nu.cl], [nm.s2, nu.s2],
      [nm.s3, nu.s3], [nm.m2, nu.m2], [nm.m3, nu.m3], [nm.ch, nu.ch],
    ];
    for (const [mid, uid] of memberSpecs) {
      if (existM.has(mid)) continue;
      await safeInsert(queryInterface, 'church_members', { id: mid, church_id: churchId, user_id: uid, is_active: true, joined_at: now, created_at: now, updated_at: now });
    }

    // ── 2. Member roles ──
    const roleAssignments = [
      [nm.sl, roleMap.service_leader], [nm.asl, roleMap.assistant_service_leader], [nm.cl, roleMap.class_leader],
      [nm.s2, roleMap.servant], [nm.s3, roleMap.servant],
      [nm.m2, roleMap.served_member], [nm.m3, roleMap.served_member], [nm.ch, roleMap.served_member],
      [m.parent, roleMap.parent],
    ];
    for (const [cmid, rid] of roleAssignments) {
      const exists = await queryInterface.sequelize.query(`SELECT id FROM member_roles WHERE church_member_id = :c AND role_id = :r LIMIT 1`, { replacements: { c: cmid, r: rid }, type: Sequelize.QueryTypes.SELECT });
      if (exists.length === 0) {
        await safeInsert(queryInterface, 'member_roles', { church_member_id: cmid, role_id: rid, church_id: churchId, assigned_at: now });
      }
    }

    // ── 3. More services, stage groups, classes ──
    await safeInsert(queryInterface, 'services', { id: N.sv2, church_id: churchId, sector_id: EXISTING.sector, name: 'Grade 8 Bible Study', schedule: JSON.stringify({ day: 'sunday', time: '10:30', frequency: 'weekly' }), is_active: true, created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'services', { id: N.sv3, church_id: churchId, sector_id: EXISTING.sector, name: 'Grade 9 Bible Study', schedule: JSON.stringify({ day: 'sunday', time: '11:00', frequency: 'weekly' }), is_active: true, created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'stage_groups', { id: N.sg4, church_id: churchId, service_id: N.sv2, name: 'Grade 7B', stage_order: 1, is_active: true });
    await safeInsert(queryInterface, 'stage_groups', { id: N.sg5, church_id: churchId, service_id: N.sv3, name: 'Grade 8B', stage_order: 1, is_active: true });
    await safeInsert(queryInterface, 'classes', { id: N.cb, church_id: churchId, service_id: N.sv2, stage_group_id: N.sg4, name: 'Class B', capacity: 25, is_active: true });
    await safeInsert(queryInterface, 'classes', { id: N.cc, church_id: churchId, service_id: N.sv3, stage_group_id: N.sg5, name: 'Class C', capacity: 20, is_active: true });

    // ── 4. More enrollments & servant assignments ──
    await safeInsert(queryInterface, 'enrollments', { church_id: churchId, service_year_id: syId, church_member_id: nm.m2, service_id: EXISTING.service, class_id: EXISTING.class, stage_group_id: EXISTING.stage_groups[0], enrolled_at: now, is_active: true });
    await safeInsert(queryInterface, 'enrollments', { church_id: churchId, service_year_id: syId, church_member_id: nm.m3, service_id: N.sv2, class_id: N.cb, stage_group_id: N.sg4, enrolled_at: now, is_active: true });
    await safeInsert(queryInterface, 'enrollments', { church_id: churchId, service_year_id: syId, church_member_id: m.served_member, service_id: N.sv2, class_id: N.cb, stage_group_id: N.sg4, enrolled_at: now, is_active: true });
    await safeInsert(queryInterface, 'servant_assignments', { church_id: churchId, service_year_id: syId, church_member_id: nm.sl, service_id: N.sv2, class_id: N.cb, is_active: true, assigned_at: now });
    await safeInsert(queryInterface, 'servant_assignments', { church_id: churchId, service_year_id: syId, church_member_id: nm.asl, service_id: EXISTING.service, class_id: EXISTING.class, is_active: true, assigned_at: now });
    await safeInsert(queryInterface, 'servant_assignments', { church_id: churchId, service_year_id: syId, church_member_id: nm.cl, service_id: N.sv3, class_id: N.cc, is_active: true, assigned_at: now });
    await safeInsert(queryInterface, 'servant_assignments', { church_id: churchId, service_year_id: syId, church_member_id: nm.s2, service_id: N.sv3, class_id: N.cc, is_active: true, assigned_at: now });
    await safeInsert(queryInterface, 'servant_assignments', { church_id: churchId, service_year_id: syId, church_member_id: nm.s3, service_id: EXISTING.service, class_id: EXISTING.class, is_active: true, assigned_at: now });

    // ── 5. Attendance sessions + records ──
    const allMembers = [m.servant, m.served_member, m.sector_leader, nm.m2, nm.m3, nm.s2, nm.s3, nm.ch];
    const sDates = [0, 7, 14, 21, 28].map(d => ago(d).toISOString().split('T')[0]);
    for (let i = 0; i < 5; i++) {
      const sid = N.ses[i];
      await safeInsert(queryInterface, 'attendance_sessions', {
        id: sid, church_id: churchId, service_id: EXISTING.service,
        service_year_id: syId, session_type: 'service',
        session_date: sDates[i], recorded_by: m.servant, created_at: now,
      });
      for (const mid of allMembers) {
        await safeInsert(queryInterface, 'attendance_records', {
          church_id: churchId,
          attendance_session_id: sid, church_member_id: mid,
          status: ['present', 'present', 'present', 'absent', 'excused'][ri(0, 4)],
        });
      }
    }

    // ── 6. Preparations ──
    const lessonTitles = ['The Creation Story', 'Noah and the Ark', "Abraham's Faith", 'Moses and the Exodus', 'The Ten Commandments', 'David and Goliath', 'Daniel in the Lion\'s Den', 'The Birth of Jesus', 'The Sermon on the Mount', 'The Parable of the Prodigal Son'];
    for (let i = 0; i < 10; i++) {
      await safeInsert(queryInterface, 'preparations', { church_id: churchId, servant_id: allMembers[ri(0, allMembers.length - 1)], service_year_id: syId, service_id: EXISTING.service, class_id: EXISTING.class, title: lessonTitles[i], description: JSON.stringify({ keyPoints: ['Point 1', 'Point 2', 'Point 3'], bibleVerses: ['John 3:16', 'Psalm 23'] }), lesson_date: ago(ri(1, 60)).toISOString().split('T')[0], status: ['draft', 'submitted', 'approved'][ri(0, 2)], reviewer_id: i % 2 === 0 ? m.servant : null, review_notes: i % 2 === 0 ? 'Good preparation, add more bible verses' : null, reviewed_at: i % 2 === 0 ? now : null, created_at: ago(ri(1, 60)), updated_at: now });
    }

    // ── 7. Tasks + assignments ──
    const taskDefs = [
      ['Memorize Psalm 23', 'Memorize and recite Psalm 23 from memory', 'memorization', 10],
      ['Read Genesis Chapters 1-5', 'Read the first 5 chapters of Genesis', 'reading', 5],
      ['Write a reflection on the Sermon on the Mount', 'Write one page reflection', 'assignment', 15],
      ['Read about the life of St. Mark', 'Read about St. Mark the Evangelist', 'reading', 8],
      ['Complete the homework on the Exodus story', 'Complete chapter questions', 'assignment', 12],
    ];
    for (let i = 0; i < 5; i++) {
      await safeInsert(queryInterface, 'tasks', { id: N.tk[i], church_id: churchId, service_year_id: syId, service_id: EXISTING.service, class_id: EXISTING.class, assigned_by: m.servant, title: taskDefs[i][0], description: taskDefs[i][1], task_type: taskDefs[i][2], due_date: ago(-ri(1, 14)).toISOString().split('T')[0], taio_points: taskDefs[i][3], created_at: now, updated_at: now });
      const assignees = [allMembers[ri(0, allMembers.length - 1)], allMembers[ri(0, allMembers.length - 1)]];
      for (const a of [...new Set(assignees)]) {
        await safeInsert(queryInterface, 'task_assignments', { church_id: churchId, task_id: N.tk[i], church_member_id: a, status: ri(0, 2) === 0 ? 'completed' : 'pending', completed_at: ri(0, 2) === 0 ? ago(ri(1, 5)) : null, verified_by: ri(0, 2) === 0 ? m.servant : null });
      }
    }

    // ── 8. Taiao transactions ──
    const taioRedemptionTx1 = 100;
    const taioRedemptionTx2 = 101;
    await safeInsert(queryInterface, 'taio_transactions', { id: taioRedemptionTx1, church_id: churchId, service_year_id: syId, church_member_id: m.servant, points: -50, reason: 'Store redemption - Cross Necklace', source_type: 'redemption', source_id: null, assigned_by: null, created_at: ago(15) });
    await safeInsert(queryInterface, 'taio_transactions', { id: taioRedemptionTx2, church_id: churchId, service_year_id: syId, church_member_id: m.sector_leader, points: -80, reason: 'Store redemption - Bible Cover', source_type: 'redemption', source_id: null, assigned_by: null, created_at: ago(3) });
    for (let i = 0; i < 28; i++) {
      const member = allMembers[ri(0, allMembers.length - 1)];
      const points = ri(1, 20) * (i < 23 ? 1 : -1);
      await safeInsert(queryInterface, 'taio_transactions', { church_id: churchId, service_year_id: syId, church_member_id: member, points, reason: ['Attendance', 'Task completed', 'Memory verse', 'Good behavior', 'Preparation submitted'][ri(0, 4)], source_type: i < 23 ? 'task' : 'adjustment', source_id: null, assigned_by: i < 23 ? null : m.servant, created_at: ago(ri(1, 90)) });
    }

    // ── 9. Store items + redemptions ──
    await safeInsert(queryInterface, 'store_items', { id: N.si[0], church_id: churchId, name: 'Cross Necklace', description: 'Silver plated cross necklace', point_cost: 50, stock_quantity: 10, is_active: true, image_url: null, created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'store_items', { id: N.si[1], church_id: churchId, name: 'Bible Cover', description: 'Leather Bible cover with cross design', point_cost: 80, stock_quantity: 5, is_active: true, image_url: null, created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'store_items', { id: N.si[2], church_id: churchId, name: 'Icon Print', description: 'Hand-painted icon of St. George', point_cost: 120, stock_quantity: 3, is_active: true, image_url: null, created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'store_redemptions', { church_id: churchId, church_member_id: m.servant, store_item_id: N.si[0], taio_transaction_id: taioRedemptionTx1, quantity: 1, status: 'fulfilled', redeemed_at: ago(15), fulfilled_at: ago(10) });
    await safeInsert(queryInterface, 'store_redemptions', { church_id: churchId, church_member_id: m.sector_leader, store_item_id: N.si[1], taio_transaction_id: taioRedemptionTx2, quantity: 1, status: 'pending', redeemed_at: ago(3), fulfilled_at: null });

    // ── 10. Events + registrations + payments (registered_by nullable) ──
    await safeInsert(queryInterface, 'events', { id: N.ev[0], church_id: churchId, service_year_id: syId, created_by: m.sector_leader, name: 'Annual Summer Camp', description: '3-day summer camp for all grades', event_type: 'conference', start_date: ago(-30).toISOString().split('T')[0], end_date: ago(-27).toISOString().split('T')[0], location: 'Wadi El Natrun Monastery', max_capacity: 50, registration_fee: 350, is_active: true, registration_deadline: ago(35).toISOString().split('T')[0], created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'events', { id: N.ev[1], church_id: churchId, service_year_id: syId, created_by: m.priest, name: 'Christmas Celebration', description: 'Annual Christmas party for children', event_type: 'festival', start_date: ago(-60).toISOString().split('T')[0], end_date: ago(-60).toISOString().split('T')[0], location: 'Church Hall', max_capacity: 100, registration_fee: 50, is_active: true, registration_deadline: ago(65).toISOString().split('T')[0], created_at: now, updated_at: now });
    const regIds = [1, 2, 3, 4];
    await safeInsert(queryInterface, 'event_registrations', { id: regIds[0], church_id: churchId, event_id: N.ev[0], church_member_id: m.servant, status: 'registered', registered_at: ago(45), total_amount: 350, paid_amount: 200, registered_by: m.sector_leader });
    await safeInsert(queryInterface, 'event_registrations', { id: regIds[1], church_id: churchId, event_id: N.ev[0], church_member_id: m.served_member, status: 'registered', registered_at: ago(44), total_amount: 350, paid_amount: 0, registered_by: m.servant });
    await safeInsert(queryInterface, 'event_registrations', { id: regIds[2], church_id: churchId, event_id: N.ev[1], church_member_id: m.parent, status: 'registered', registered_at: ago(70), total_amount: 50, paid_amount: 50, registered_by: m.priest });
    await safeInsert(queryInterface, 'event_registrations', { id: regIds[3], church_id: churchId, event_id: N.ev[1], church_member_id: nm.ch, status: 'attended', registered_at: ago(69), total_amount: 50, paid_amount: 50, registered_by: m.parent });
    await safeInsert(queryInterface, 'payment_installments', { church_id: churchId, event_registration_id: regIds[0], amount: 200, due_date: ago(35).toISOString().split('T')[0], paid_at: ago(35), payment_method: 'cash', receipt_url: null, recorded_by: m.servant, created_at: ago(35) });

    // ── 11. Families ──
    await safeInsert(queryInterface, 'families', { id: N.fam, church_id: churchId, name: 'Adel Family', created_at: now });
    await safeInsert(queryInterface, 'family_members', { church_id: churchId, family_id: N.fam, church_member_id: m.parent, relation: 'parent' });
    await safeInsert(queryInterface, 'family_members', { church_id: churchId, family_id: N.fam, church_member_id: nm.ch, relation: 'child' });
    await safeInsert(queryInterface, 'family_members', { church_id: churchId, family_id: N.fam, church_member_id: m.served_member, relation: 'child' });
    await safeInsert(queryInterface, 'sibling_pairs', { church_id: churchId, church_member_id_a: nm.ch, church_member_id_b: m.served_member });

    // ── 12. Follow-ups (families + assignments + logs) ──
    await safeInsert(queryInterface, 'followup_families', { id: N.fu[0], church_id: churchId, service_year_id: syId, servant_id: m.servant, name: 'Mina Girgis Family', service_id: EXISTING.service, status: 'active', notes: 'Following up on attendance and spiritual growth', created_at: ago(90), updated_at: now });
    await safeInsert(queryInterface, 'followup_assignments', { church_id: churchId, followup_family_id: N.fu[0], church_member_id: m.served_member, is_active: true, assigned_at: ago(90) });
    await safeInsert(queryInterface, 'followup_families', { id: N.fu[1], church_id: churchId, service_year_id: syId, servant_id: nm.s2, name: 'Karim Family', service_id: N.sv2, status: 'active', notes: 'New follow-up, building relationship', created_at: ago(30), updated_at: now });
    await safeInsert(queryInterface, 'followup_assignments', { church_id: churchId, followup_family_id: N.fu[1], church_member_id: nm.m2, is_active: true, assigned_at: ago(30) });
    await safeInsert(queryInterface, 'followup_families', { id: N.fu[2], church_id: churchId, service_year_id: syId, servant_id: m.servant, name: 'Youssef Family', service_id: EXISTING.service, status: 'completed', notes: 'Member has improved significantly', created_at: ago(120), updated_at: ago(30) });
    await safeInsert(queryInterface, 'followup_assignments', { church_id: churchId, followup_family_id: N.fu[2], church_member_id: nm.m3, is_active: false, assigned_at: ago(120) });
    for (const fuid of N.fu) {
      for (let i = 0; i < ri(2, 5); i++) {
        const memberId = fuid === N.fu[0] ? m.served_member : (fuid === N.fu[1] ? nm.m2 : nm.m3);
        await safeInsert(queryInterface, 'followup_logs', { church_id: churchId, followup_family_id: fuid, church_member_id: memberId, log_type: ['call', 'visit', 'meeting', 'message', 'other'][ri(0, 4)], notes: `Follow-up activity #${i + 1}`, next_action: i < 2 ? 'Continue regular check-ins' : null, next_action_date: null, logged_at: ago(ri(1, 60)), created_at: ago(ri(1, 60)), updated_at: now });
      }
    }

    // ── 13. Lesson library ──
    const lessons = [
      [N.ls[0], 'The Life of Moses', 'bible', '["old-testament","exodus","moses"]', m.servant],
      [N.ls[1], 'The Parables of Jesus', 'bible', '["new-testament","parables","jesus"]', m.servant],
      [N.ls[2], 'Coptic Hymn: Tenouh.O', 'hymn', '["hymn","coptic","doxology"]', nm.s2],
      [N.ls[3], 'The Liturgy: Meaning of Prayers', 'liturgy', '["liturgy","prayers","worship"]', nm.cl],
      [N.ls[4], 'Fruits of the Holy Spirit', 'spiritual', '["holy-spirit","virtues","spiritual-growth"]', m.servant],
    ];
    for (const [lid, title, cat, tags, creator] of lessons) {
      await safeInsert(queryInterface, 'lesson_library', { id: lid, church_id: churchId, service_year_id: syId, service_id: EXISTING.service, class_id: EXISTING.class, stage_group_id: EXISTING.stage_groups[0], title, category: cat, tags, created_by: creator, created_at: ago(ri(10, 45)), updated_at: now });
    }

    // ── 14. Activities + members + sessions + attendance ──
    await safeInsert(queryInterface, 'activities', { id: N.ac[0], church_id: churchId, service_year_id: syId, service_id: EXISTING.service, name: 'Church Choir', activity_type: 'choir', description: 'Weekly choir practice', schedule: JSON.stringify({ day: 'friday', time: '18:00', frequency: 'weekly' }), max_capacity: 40, is_active: true, led_by: m.servant, created_at: ago(120), updated_at: now });
    await safeInsert(queryInterface, 'activities', { id: N.ac[1], church_id: churchId, service_year_id: syId, service_id: N.sv2, name: 'Bible Memorization Contest', activity_type: 'educational', description: 'Monthly competition', schedule: JSON.stringify({ day: 'sunday', time: '12:00', frequency: 'monthly' }), max_capacity: 30, is_active: true, led_by: nm.s2, created_at: ago(60), updated_at: now });
    await safeInsert(queryInterface, 'activities', { id: N.ac[2], church_id: churchId, service_year_id: syId, service_id: EXISTING.service, name: 'Football Tournament', activity_type: 'sports', description: 'Inter-class football tournament', schedule: JSON.stringify({ day: 'saturday', time: '15:00', frequency: 'biweekly' }), max_capacity: 50, is_active: true, led_by: m.sector_leader, created_at: ago(30), updated_at: now });
    const actEnrollees = [m.servant, m.served_member, nm.m2, m.sector_leader, nm.m3, nm.s2, nm.s3];
    for (const aid of N.ac) {
      for (const eid of actEnrollees) {
        if (Math.random() > 0.4) {
          await safeInsert(queryInterface, 'activity_members', { church_id: churchId, activity_id: aid, church_member_id: eid, joined_at: ago(ri(10, 100)).toISOString().split('T')[0], is_active: true, created_at: now, updated_at: now });
        }
      }
      for (let w = 0; w < 6; w++) {
        const d = ago(w * 7).toISOString().split('T')[0];
        const sesId = 1000 + aid * 10 + w;
        await safeInsert(queryInterface, 'activity_sessions', { id: sesId, church_id: churchId, activity_id: aid, session_date: d, notes: null, created_at: ago(w * 7), updated_at: ago(w * 7) });
        for (const eid of actEnrollees) {
          if (Math.random() > 0.3) {
            await safeInsert(queryInterface, 'activity_attendance', { church_id: churchId, activity_session_id: sesId, church_member_id: eid, status: Math.random() > 0.2 ? 'present' : 'absent', created_at: ago(w * 7), updated_at: ago(w * 7) });
          }
        }
      }
    }

    // ── 15. Achievement definitions + member achievements ──
    const achDefs = [
      [N.ach[0], 'Perfect Attendance - 1 Month', null, 'attendance_streak', JSON.stringify({ value: 4, points: 50 })],
      [N.ach[1], 'Memory Master', null, 'task_count', JSON.stringify({ value: 5, points: 100 })],
      [N.ach[2], 'Faithful Servant', null, 'task_count', JSON.stringify({ value: 10, points: 200 })],
      [N.ach[3], 'Taiao Champion', null, 'attendance_streak', JSON.stringify({ value: 8, points: 300 })],
      [N.ach[4], 'Active Participant', null, 'participation', JSON.stringify({ value: 3, points: 150 })],
    ];
    for (const [aid, name, badgeUrl, triggerType, triggerConfig] of achDefs) {
      await safeInsert(queryInterface, 'achievement_definitions', { id: aid, church_id: churchId, name, badge_url: badgeUrl, trigger_type: triggerType, trigger_config: triggerConfig, is_active: true, created_at: now, updated_at: now });
    }
    await safeInsert(queryInterface, 'member_achievements', { church_id: churchId, achievement_id: N.ach[0], church_member_id: m.sector_leader, awarded_at: ago(15), created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'member_achievements', { church_id: churchId, achievement_id: N.ach[0], church_member_id: m.servant, awarded_at: ago(10), created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'member_achievements', { church_id: churchId, achievement_id: N.ach[4], church_member_id: m.servant, awarded_at: ago(30), created_at: now, updated_at: now });
    await safeInsert(queryInterface, 'member_achievements', { church_id: churchId, achievement_id: N.ach[1], church_member_id: m.sector_leader, awarded_at: ago(5), created_at: now, updated_at: now });

    // ── 16. Notifications ──
    const notifMsgs = [
      { title: 'Attendance Recorded', body: 'Your attendance for Sunday session has been recorded.', type: 'attendance' },
      { title: 'New Task Assigned', body: 'You have been assigned a new memorization task.', type: 'task' },
      { title: 'Event Reminder', body: 'Reminder: Summer Camp starts next week!', type: 'event' },
      { title: 'Taio Points Awarded', body: 'You earned 10 taio points for your attendance!', type: 'general' },
      { title: 'Welcome', body: 'Welcome to the church management system!', type: 'general' },
    ];
    for (const mid of allMembers) {
      for (let i = 0; i < ri(2, 5); i++) {
        const msg = notifMsgs[ri(0, notifMsgs.length - 1)];
        await safeInsert(queryInterface, 'notifications', { church_id: churchId, church_member_id: mid, title: msg.title, body: msg.body, type: msg.type, source_type: null, source_id: null, is_read: Math.random() > 0.4, sent_at: ago(ri(1, 60)), read_at: Math.random() > 0.4 ? ago(ri(1, 10)) : null });
      }
    }

    console.log('========================================');
    console.log('  Comprehensive test data seeded!');
    console.log('========================================');
    console.log('Login: any email above + password123');
    console.log('Church ID: 1');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'notifications', 'followup_logs', 'followup_assignments', 'followup_families', 'lesson_library',
      'activity_attendance', 'activity_sessions', 'activity_members', 'activities',
      'member_achievements', 'achievement_definitions', 'fcm_tokens',
      'payment_installments', 'event_registrations', 'events',
      'store_redemptions', 'store_items',
      'taio_transactions', 'task_assignments', 'tasks',
      'preparations', 'attendance_records', 'attendance_sessions',
      'sibling_pairs', 'family_members', 'families',
      'servant_assignments', 'enrollments', 'classes', 'stage_groups',
      'services', 'sectors', 'service_years',
      'member_roles', 'church_members', 'users', 'churches',
    ];
    for (const t of tables) {
      try { await queryInterface.sequelize.query(`DELETE FROM ${t}`); } catch (e) { /* skip */ }
    }
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('All test data cleared');
  },
};
