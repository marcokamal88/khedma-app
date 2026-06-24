'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('lesson_library', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      preparation_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'preparations', key: 'id' } },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      service_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'services', key: 'id' } },
      class_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'classes', key: 'id' } },
      stage_group_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'stage_groups', key: 'id' } },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.ENUM('bible','hymn','catechism','liturgy','spiritual','activity','other'), defaultValue: 'other' },
      tags: { type: Sequelize.JSON, allowNull: true },
      file_url: { type: Sequelize.STRING(500), allowNull: true },
      created_by: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('lesson_library', ['church_id', 'service_id']);
    await queryInterface.addIndex('lesson_library', ['church_id', 'category']);
    await queryInterface.addIndex('lesson_library', ['church_id', 'stage_group_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('lesson_library');
  },
};
