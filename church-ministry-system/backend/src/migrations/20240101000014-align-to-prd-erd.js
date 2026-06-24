'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // ── DROP all restructured tables (both old + new, for idempotent re-runs) ──
    const dropIfExists = async (name) => {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS \`${name}\``);
    };
    await dropIfExists('follow_up_activities');
    await dropIfExists('follow_ups');
    await dropIfExists('activity_attendance');
    await dropIfExists('activity_enrollments');
    await dropIfExists('device_tokens');
    await dropIfExists('member_achievements');
    await dropIfExists('achievements');
    // new tables that may exist from a prior partial run
    await dropIfExists('activity_sessions');
    await dropIfExists('activity_members');
    await dropIfExists('followup_families');
    await dropIfExists('followup_assignments');
    await dropIfExists('followup_logs');
    await dropIfExists('achievement_definitions');
    await dropIfExists('fcm_tokens');
    await dropIfExists('preparation_comments');
    await dropIfExists('member_profiles');

    // ── 1. ACTIVITIES → 3-tier ──

    await queryInterface.createTable('activity_sessions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      activity_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'activities', key: 'id' } },
      session_date: { type: Sequelize.DATEONLY, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('activity_sessions', ['activity_id', 'session_date'], { unique: true });
    await queryInterface.addIndex('activity_sessions', ['church_id']);

    await queryInterface.createTable('activity_members', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      activity_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'activities', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      joined_at: { type: Sequelize.DATEONLY, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('activity_members', ['activity_id', 'church_member_id'], { unique: true });
    await queryInterface.addIndex('activity_members', ['church_id']);

    await queryInterface.createTable('activity_attendance', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      activity_session_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'activity_sessions', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM('present','absent','excused'), defaultValue: 'present' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('activity_attendance', ['activity_session_id', 'church_member_id'], { unique: true });
    await queryInterface.addIndex('activity_attendance', ['church_id']);

    // Activities: rename created_by → led_by
    const actCols = await queryInterface.sequelize.query(
      'SHOW COLUMNS FROM `activities`', { type: Sequelize.QueryTypes.SELECT },
    );
    const actColNames = actCols.map(r => r.Field);
    if (actColNames.includes('created_by') && !actColNames.includes('led_by')) {
      await queryInterface.removeColumn('activities', 'created_by');
      await queryInterface.addColumn('activities', 'led_by', {
        type: Sequelize.INTEGER, allowNull: true,
      });
    }
    // Activities: rename type → activity_type
    if (actColNames.includes('type') && !actColNames.includes('activity_type')) {
      await queryInterface.renameColumn('activities', 'type', 'activity_type');
    }

    // ── 2. FOLLOW-UP restructure ──

    await queryInterface.createTable('followup_families', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      servant_id: { type: Sequelize.INTEGER, allowNull: false, comment: 'church_member_id of the servant leading this family' },
      name: { type: Sequelize.STRING(255), allowNull: true },
      service_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'services', key: 'id' } },
      status: { type: Sequelize.ENUM('active','paused','completed'), defaultValue: 'active' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('followup_families', ['church_id', 'servant_id']);
    await queryInterface.addIndex('followup_families', ['church_id', 'service_year_id']);

    await queryInterface.createTable('followup_assignments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      followup_family_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'followup_families', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      assigned_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('followup_assignments', ['followup_family_id', 'church_member_id'], { unique: true });
    await queryInterface.addIndex('followup_assignments', ['church_id']);

    await queryInterface.createTable('followup_logs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      followup_family_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'followup_families', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      log_type: { type: Sequelize.ENUM('call','visit','meeting','message','other'), allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: false },
      next_action: { type: Sequelize.TEXT, allowNull: true },
      next_action_date: { type: Sequelize.DATEONLY, allowNull: true },
      logged_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('followup_logs', ['followup_family_id']);
    await queryInterface.addIndex('followup_logs', ['church_id']);

    // ── 3. NEW tables ──

    // Preparation Comments
    await queryInterface.createTable('preparation_comments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      preparation_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'preparations', key: 'id' } },
      author_id: { type: Sequelize.INTEGER, allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('preparation_comments', ['preparation_id']);
    await queryInterface.addIndex('preparation_comments', ['church_id']);

    // Member Profiles (1:1 with church_members)
    await queryInterface.createTable('member_profiles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'church_members', key: 'id' } },
      gender: { type: Sequelize.ENUM('male','female'), allowNull: true },
      birth_date: { type: Sequelize.DATEONLY, allowNull: true },
      school_grade: { type: Sequelize.TINYINT, allowNull: true },
      phones: { type: Sequelize.JSON, allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('member_profiles', ['church_member_id'], { unique: true });
    await queryInterface.addIndex('member_profiles', ['church_id']);

    // ── 4. RENAMED tables ──

    // device_tokens → fcm_tokens
    await queryInterface.createTable('fcm_tokens', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      token: { type: Sequelize.TEXT, allowNull: false },
      device_type: { type: Sequelize.STRING(20), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('fcm_tokens', ['church_member_id']);
    await queryInterface.addIndex('fcm_tokens', ['church_id']);

    // achievements → achievement_definitions
    await queryInterface.createTable('achievement_definitions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      badge_url: { type: Sequelize.STRING(500), allowNull: true },
      trigger_type: { type: Sequelize.ENUM('attendance_streak','task_count','memorization','participation','custom'), allowNull: false },
      trigger_config: { type: Sequelize.JSON, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('achievement_definitions', ['church_id']);

    await queryInterface.createTable('member_achievements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      achievement_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'achievement_definitions', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      awarded_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('member_achievements', ['achievement_id', 'church_member_id'], { unique: true });
    await queryInterface.addIndex('member_achievements', ['church_id']);
    await queryInterface.addIndex('member_achievements', ['church_member_id']);

    // ── 5. ALTER existing tables (idempotent - check column existence) ──

    const colExists = async (table, col) => {
      const rows = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM \`${table}\` WHERE Field = :col`,
        { replacements: { col }, type: Sequelize.QueryTypes.SELECT },
      );
      return rows.length > 0;
    };
    const addCol = async (table, col, def) => {
      if (!(await colExists(table, col))) {
        await queryInterface.addColumn(table, col, def);
      }
    };

    // audit_logs: user_id+member_id → actor_id; old_values → before_snapshot; new_values → after_snapshot
    if (!(await colExists('audit_logs', 'actor_id'))) {
      await queryInterface.addColumn('audit_logs', 'actor_id', { type: Sequelize.INTEGER, allowNull: true });
      await queryInterface.sequelize.query('UPDATE audit_logs SET actor_id = user_id');
    }
    if (await colExists('audit_logs', 'user_id')) {
      await queryInterface.removeColumn('audit_logs', 'user_id');
    }
    if (await colExists('audit_logs', 'member_id')) {
      await queryInterface.removeColumn('audit_logs', 'member_id');
    }
    if (await colExists('audit_logs', 'old_values')) {
      await queryInterface.renameColumn('audit_logs', 'old_values', 'before_snapshot');
    }
    if (await colExists('audit_logs', 'new_values')) {
      await queryInterface.renameColumn('audit_logs', 'new_values', 'after_snapshot');
    }

    // servant_assignments: add leader_role + timestamps
    await addCol('servant_assignments', 'leader_role', {
      type: Sequelize.ENUM('service_leader','assistant_service_leader','class_leader','servant'),
      allowNull: true,
    });
    await addCol('servant_assignments', 'created_at', {
      type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    await addCol('servant_assignments', 'updated_at', {
      type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    });
    // deleted_at already added by migration 04 — skip

    // event_registrations: add registered_by + timestamps
    await addCol('event_registrations', 'registered_by', {
      type: Sequelize.INTEGER, allowNull: true,
    });
    await addCol('event_registrations', 'created_at', {
      type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    await addCol('event_registrations', 'updated_at', {
      type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    });

    // lesson_library: add published_at
    await addCol('lesson_library', 'published_at', {
      type: Sequelize.DATE, allowNull: true,
    });

    // preparations: add version
    await addCol('preparations', 'version', {
      type: Sequelize.INTEGER, defaultValue: 1,
    });

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Reverse ALTERs
    await queryInterface.removeColumn('preparations', 'version');
    await queryInterface.removeColumn('lesson_library', 'published_at');
    await queryInterface.removeColumn('event_registrations', 'updated_at');
    await queryInterface.removeColumn('event_registrations', 'created_at');
    await queryInterface.removeColumn('event_registrations', 'registered_by');
    await queryInterface.removeColumn('servant_assignments', 'updated_at');
    await queryInterface.removeColumn('servant_assignments', 'created_at');
    await queryInterface.removeColumn('servant_assignments', 'leader_role');
    await queryInterface.renameColumn('audit_logs', 'before_snapshot', 'old_values');
    await queryInterface.renameColumn('audit_logs', 'after_snapshot', 'new_values');
    await queryInterface.addColumn('audit_logs', 'member_id', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.sequelize.query('UPDATE audit_logs SET user_id = actor_id');
    await queryInterface.addColumn('audit_logs', 'user_id', { type: Sequelize.INTEGER, allowNull: false });
    await queryInterface.removeColumn('audit_logs', 'actor_id');

    // Drop new/renamed tables
    await queryInterface.dropTable('member_achievements');
    await queryInterface.dropTable('achievement_definitions');
    await queryInterface.dropTable('fcm_tokens');
    await queryInterface.dropTable('member_profiles');
    await queryInterface.dropTable('preparation_comments');
    await queryInterface.dropTable('followup_logs');
    await queryInterface.dropTable('followup_assignments');
    await queryInterface.dropTable('followup_families');
    await queryInterface.dropTable('activity_attendance');
    await queryInterface.dropTable('activity_members');
    await queryInterface.dropTable('activity_sessions');

    // Restore activities columns
    await queryInterface.renameColumn('activities', 'activity_type', 'type');
    await queryInterface.removeColumn('activities', 'led_by');
    await queryInterface.addColumn('activities', 'created_by', {
      type: Sequelize.INTEGER, allowNull: false, defaultValue: 0,
    });

    // Recreate old tables
    await queryInterface.createTable('device_tokens', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      token: { type: Sequelize.TEXT, allowNull: false },
      platform: { type: Sequelize.ENUM('android','ios','web'), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('achievements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      icon: { type: Sequelize.STRING(100), allowNull: true },
      criteria_type: { type: Sequelize.ENUM('attendance_streak','task_count','memorization','participation','custom'), allowNull: false },
      criteria_value: { type: Sequelize.INTEGER, allowNull: false },
      taiao_points: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('member_achievements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      achievement_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'achievements', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      earned_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('activity_enrollments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      activity_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'activities', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      enrolled_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('activity_attendance', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      activity_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'activities', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      session_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM('present','absent','excused'), defaultValue: 'present' },
      recorded_by: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('follow_ups', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      servant_id: { type: Sequelize.INTEGER, allowNull: false },
      served_member_id: { type: Sequelize.INTEGER, allowNull: false },
      service_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'services', key: 'id' } },
      status: { type: Sequelize.ENUM('active','paused','completed'), defaultValue: 'active' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('follow_up_activities', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      follow_up_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'follow_ups', key: 'id' } },
      activity_type: { type: Sequelize.ENUM('call','visit','meeting','message','other'), allowNull: false },
      activity_date: { type: Sequelize.DATEONLY, allowNull: false },
      summary: { type: Sequelize.TEXT, allowNull: false },
      follow_up_action: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
};
