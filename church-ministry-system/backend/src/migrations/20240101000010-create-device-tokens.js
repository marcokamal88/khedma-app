'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
    await queryInterface.addIndex('device_tokens', ['church_member_id']);
    await queryInterface.addIndex('device_tokens', ['church_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('device_tokens');
  },
};
