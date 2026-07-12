'use strict';

/** @type {import('sequelize-cli').QueryInterface} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('member_profiles');
    if (!tableInfo.notes) {
      await queryInterface.addColumn('member_profiles', 'notes', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('member_profiles', 'notes');
  },
};
