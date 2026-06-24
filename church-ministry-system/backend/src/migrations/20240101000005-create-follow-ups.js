'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('follow_ups', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      servant_id: { type: Sequelize.INTEGER, allowNull: false, comment: 'church_member_id of the servant' },
      served_member_id: { type: Sequelize.INTEGER, allowNull: false, comment: 'church_member_id of the served member' },
      service_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'services', key: 'id' } },
      status: { type: Sequelize.ENUM('active','paused','completed'), defaultValue: 'active' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('follow_ups', ['church_id', 'servant_id']);
    await queryInterface.addIndex('follow_ups', ['church_id', 'served_member_id']);
    await queryInterface.addIndex('follow_ups', ['church_id', 'service_year_id']);

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
    await queryInterface.addIndex('follow_up_activities', ['follow_up_id']);
    await queryInterface.addIndex('follow_up_activities', ['church_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('follow_up_activities');
    await queryInterface.dropTable('follow_ups');
  },
};
