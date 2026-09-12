'use strict';

/** @type {import('sequelize-cli').QueryInterface} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // --- helpers ---
    const colExists = async (table, col) => {
      const rows = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM \`${table}\` WHERE Field = :col`,
        { replacements: { col }, type: Sequelize.QueryTypes.SELECT },
      );
      return rows.length > 0;
    };

    // 1. followup_families: rename servant_id -> responsible_member_id, add class_id, target_type
    if (await colExists('followup_families', 'servant_id') && !(await colExists('followup_families', 'responsible_member_id'))) {
      await queryInterface.renameColumn('followup_families', 'servant_id', 'responsible_member_id');
    }
    if (!(await colExists('followup_families', 'class_id'))) {
      await queryInterface.addColumn('followup_families', 'class_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'classes', key: 'id' },
      });
      await queryInterface.addIndex('followup_families', ['class_id']);
    }
    if (!(await colExists('followup_families', 'target_type'))) {
      await queryInterface.addColumn('followup_families', 'target_type', {
        type: Sequelize.ENUM('served_member', 'servant'),
        allowNull: false,
        defaultValue: 'served_member',
      });
    }

    // MySQL-compatible uniqueness for (church_id, responsible_member_id, service_year_id, target_type, class_id)
    // Use generated column for NULL -> 0 sentinel because MySQL UNIQUE treats NULL as distinct
    if (!(await colExists('followup_families', 'class_id_or_zero'))) {
      await queryInterface.sequelize.query(`
        ALTER TABLE \`followup_families\`
        ADD COLUMN \`class_id_or_zero\` INT GENERATED ALWAYS AS (IFNULL(\`class_id\`, 0)) STORED
      `);
    }
    // add unique if not exists
    const fFamilyIndexes = await queryInterface.sequelize.query('SHOW INDEX FROM `followup_families`', { type: Sequelize.QueryTypes.SELECT });
    const hasFollowupUnique = fFamilyIndexes.some(r => r.Key_name === 'followup_families_unique_responsible_class_year_target');
    if (!hasFollowupUnique) {
      try {
        await queryInterface.addIndex('followup_families', ['church_id', 'responsible_member_id', 'service_year_id', 'target_type', 'class_id_or_zero'], {
          unique: true,
          name: 'followup_families_unique_responsible_class_year_target',
        });
      } catch (e) { /* ignore if duplicate */ }
    }

    // 2. followup_assignments: rename church_member_id -> target_member_id, add service_year_id, class_id, assigned_by, unassigned_at
    if (await colExists('followup_assignments', 'church_member_id') && !(await colExists('followup_assignments', 'target_member_id'))) {
      await queryInterface.renameColumn('followup_assignments', 'church_member_id', 'target_member_id');
    }
    if (!(await colExists('followup_assignments', 'service_year_id'))) {
      await queryInterface.addColumn('followup_assignments', 'service_year_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'service_years', key: 'id' },
      });
      await queryInterface.addIndex('followup_assignments', ['service_year_id']);
    }
    if (!(await colExists('followup_assignments', 'class_id'))) {
      await queryInterface.addColumn('followup_assignments', 'class_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'classes', key: 'id' },
      });
    }
    if (!(await colExists('followup_assignments', 'assigned_by'))) {
      await queryInterface.addColumn('followup_assignments', 'assigned_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'church_members', key: 'id' },
      });
    }
    if (!(await colExists('followup_assignments', 'unassigned_at'))) {
      await queryInterface.addColumn('followup_assignments', 'unassigned_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // 3. followup_logs: rename church_member_id -> target_member_id, add created_by, status_at_log, deleted_at
    if (await colExists('followup_logs', 'church_member_id') && !(await colExists('followup_logs', 'target_member_id'))) {
      await queryInterface.renameColumn('followup_logs', 'church_member_id', 'target_member_id');
    }
    if (!(await colExists('followup_logs', 'created_by'))) {
      await queryInterface.addColumn('followup_logs', 'created_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'church_members', key: 'id' },
      });
      await queryInterface.addIndex('followup_logs', ['created_by']);
    }
    if (!(await colExists('followup_logs', 'status_at_log'))) {
      await queryInterface.addColumn('followup_logs', 'status_at_log', {
        type: Sequelize.ENUM('active', 'paused', 'completed'),
        allowNull: true,
      });
    }
    if (!(await colExists('followup_logs', 'deleted_at'))) {
      await queryInterface.addColumn('followup_logs', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // --- Backfill existing data (all are served_member) ---
    // families: class_id from first assignment's enrollment or servant assignment; keep NULL if not resolvable (secretary case)
    // Use first assignment's target to infer class via enrollments
    await queryInterface.sequelize.query(`
      UPDATE \`followup_families\` f
      LEFT JOIN \`followup_assignments\` fa ON fa.followup_family_id = f.id
      LEFT JOIN \`enrollments\` e ON e.church_member_id = fa.target_member_id AND e.service_year_id = f.service_year_id AND e.is_active = 1
      SET f.class_id = COALESCE(f.class_id, e.class_id)
      WHERE f.target_type = 'served_member' AND f.class_id IS NULL
    `);

    // assignments: backfill service_year_id, class_id, assigned_by
    await queryInterface.sequelize.query(`
      UPDATE \`followup_assignments\` fa
      JOIN \`followup_families\` f ON f.id = fa.followup_family_id
      SET fa.service_year_id = COALESCE(fa.service_year_id, f.service_year_id),
          fa.class_id = COALESCE(fa.class_id, f.class_id),
          fa.assigned_by = COALESCE(fa.assigned_by, f.responsible_member_id)
      WHERE fa.service_year_id IS NULL OR fa.class_id IS NULL OR fa.assigned_by IS NULL
    `);

    // logs: backfill created_by = family's responsible, status_at_log = family's status, ensure target still correct
    await queryInterface.sequelize.query(`
      UPDATE \`followup_logs\` l
      JOIN \`followup_families\` f ON f.id = l.followup_family_id
      SET l.created_by = COALESCE(l.created_by, f.responsible_member_id),
          l.status_at_log = COALESCE(l.status_at_log, f.status)
      WHERE l.created_by IS NULL OR l.status_at_log IS NULL
    `);

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    // remove unique and generated column
    try { await queryInterface.removeIndex('followup_families', 'followup_families_unique_responsible_class_year_target'); } catch {}
    const colExists = async (table, col) => {
      const rows = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM \`${table}\` WHERE Field = :col`,
        { replacements: { col }, type: Sequelize.QueryTypes.SELECT },
      );
      return rows.length > 0;
    };
    if (await colExists('followup_families', 'class_id_or_zero')) {
      await queryInterface.sequelize.query('ALTER TABLE `followup_families` DROP COLUMN `class_id_or_zero`');
    }
    if (await colExists('followup_families', 'target_type')) await queryInterface.removeColumn('followup_families', 'target_type');
    if (await colExists('followup_families', 'class_id')) await queryInterface.removeColumn('followup_families', 'class_id');
    if (await colExists('followup_families', 'responsible_member_id')) {
      await queryInterface.renameColumn('followup_families', 'responsible_member_id', 'servant_id');
    }

    if (await colExists('followup_assignments', 'unassigned_at')) await queryInterface.removeColumn('followup_assignments', 'unassigned_at');
    if (await colExists('followup_assignments', 'assigned_by')) await queryInterface.removeColumn('followup_assignments', 'assigned_by');
    if (await colExists('followup_assignments', 'class_id')) await queryInterface.removeColumn('followup_assignments', 'class_id');
    if (await colExists('followup_assignments', 'service_year_id')) await queryInterface.removeColumn('followup_assignments', 'service_year_id');
    if (await colExists('followup_assignments', 'target_member_id')) await queryInterface.renameColumn('followup_assignments', 'target_member_id', 'church_member_id');

    if (await colExists('followup_logs', 'deleted_at')) await queryInterface.removeColumn('followup_logs', 'deleted_at');
    if (await colExists('followup_logs', 'status_at_log')) await queryInterface.removeColumn('followup_logs', 'status_at_log');
    if (await colExists('followup_logs', 'created_by')) await queryInterface.removeColumn('followup_logs', 'created_by');
    if (await colExists('followup_logs', 'target_member_id')) await queryInterface.renameColumn('followup_logs', 'target_member_id', 'church_member_id');

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
};
