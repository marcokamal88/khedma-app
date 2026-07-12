'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    await queryInterface.sequelize.query(`
      ALTER TABLE attendance_sessions
      ADD COLUMN class_id INTEGER NULL,
      ADD INDEX idx_attendance_sessions_class (church_id, class_id, session_date)
    `);

    await queryInterface.sequelize.query(`
      UPDATE attendance_sessions s
      JOIN servant_assignments sa
        ON sa.church_member_id = s.recorded_by
       AND sa.service_year_id = s.service_year_id
       AND sa.service_id = s.service_id
       AND sa.is_active = 1
      SET s.class_id = sa.class_id
      WHERE s.class_id IS NULL
    `);

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.sequelize.query(`
      ALTER TABLE attendance_sessions
      DROP INDEX idx_attendance_sessions_class,
      DROP COLUMN class_id
    `);
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
};
