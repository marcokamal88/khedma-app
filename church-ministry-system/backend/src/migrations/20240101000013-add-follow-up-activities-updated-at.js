'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const cols = await queryInterface.describeTable('follow_up_activities');
    if (!cols.updated_at) {
      await queryInterface.addColumn('follow_up_activities', 'updated_at', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('follow_up_activities', 'updated_at');
  },
};
