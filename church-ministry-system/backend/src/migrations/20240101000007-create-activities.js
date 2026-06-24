'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('activities', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      service_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'services', key: 'id' } },
      name: { type: Sequelize.STRING(255), allowNull: false },
      type: { type: Sequelize.ENUM('choir','theater','sports','festival','educational','coptic','memorization','other'), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      schedule: { type: Sequelize.JSON, allowNull: true },
      max_capacity: { type: Sequelize.INTEGER, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('activities', ['church_id']);
    await queryInterface.addIndex('activities', ['church_id', 'type']);

    await queryInterface.createTable('activity_enrollments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      activity_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'activities', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      enrolled_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('activity_enrollments', ['activity_id', 'church_member_id'], { unique: true });
    await queryInterface.addIndex('activity_enrollments', ['church_id']);

    await queryInterface.createTable('activity_attendance', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      activity_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'activities', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      session_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM('present','absent','excused'), defaultValue: 'present' },
      recorded_by: { type: Sequelize.INTEGER, allowNull: false },
      recorded_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('activity_attendance', ['activity_id', 'church_member_id', 'session_date'], { unique: true });
    await queryInterface.addIndex('activity_attendance', ['church_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('activity_attendance');
    await queryInterface.dropTable('activity_enrollments');
    await queryInterface.dropTable('activities');
  },
};
