'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sector_assignments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'church_members', key: 'id' }, onDelete: 'CASCADE' },
      sector_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'sectors', key: 'id' }, onDelete: 'CASCADE' },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      assigned_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('sector_assignments', ['church_member_id']);
    await queryInterface.addIndex('sector_assignments', ['sector_id']);
    await queryInterface.addIndex('sector_assignments', ['church_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sector_assignments');
  },
};
