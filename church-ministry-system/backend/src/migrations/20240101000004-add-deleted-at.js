'use strict';

const TABLES_NEEDING_DELETED_AT = [
  'church_members',
  'member_roles',
  'service_years',
  'stage_groups',
  'classes',
  'enrollments',
  'servant_assignments',
  'attendance_sessions',
  'attendance_records',
  'preparations',
  'preparation_files',
  'tasks',
  'task_assignments',
  'taiao_transactions',
  'store_items',
  'store_redemptions',
  'events',
  'event_registrations',
  'payment_installments',
  'families',
  'family_members',
  'sibling_pairs',
  'notifications',
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const table of TABLES_NEEDING_DELETED_AT) {
      const columns = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM \`${table}\` WHERE Field = 'deleted_at'`,
        { type: Sequelize.QueryTypes.SELECT },
      );
      if (columns.length === 0) {
        await queryInterface.addColumn(table, 'deleted_at', {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    for (const table of TABLES_NEEDING_DELETED_AT.reverse()) {
      await queryInterface.removeColumn(table, 'deleted_at');
    }
  },
};
