'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('achievements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      icon: { type: Sequelize.STRING(100), allowNull: true },
      criteria_type: { type: Sequelize.ENUM('attendance_streak','task_count','memorization','participation','custom'), allowNull: false },
      criteria_value: { type: Sequelize.INTEGER, allowNull: false, comment: 'e.g. 5 for 5 consecutive attendances' },
      taiao_points: { type: Sequelize.INTEGER, defaultValue: 0, comment: 'Bonus points on earning' },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('achievements', ['church_id']);

    await queryInterface.createTable('member_achievements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      achievement_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'achievements', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      earned_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('member_achievements', ['achievement_id', 'church_member_id'], { unique: true });
    await queryInterface.addIndex('member_achievements', ['church_id']);
    await queryInterface.addIndex('member_achievements', ['church_member_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('member_achievements');
    await queryInterface.dropTable('achievements');
  },
};
