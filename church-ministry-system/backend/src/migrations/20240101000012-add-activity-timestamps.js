'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = ['activity_enrollments', 'activity_attendance'];
    for (const table of tables) {
      const cols = await queryInterface.describeTable(table);
      if (!cols.created_at) {
        await queryInterface.addColumn(table, 'created_at', {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        });
      }
      if (!cols.updated_at) {
        await queryInterface.addColumn(table, 'updated_at', {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        });
      }
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('activity_attendance', 'created_at');
    await queryInterface.removeColumn('activity_attendance', 'updated_at');
    await queryInterface.removeColumn('activity_enrollments', 'created_at');
    await queryInterface.removeColumn('activity_enrollments', 'updated_at');
  },
};
