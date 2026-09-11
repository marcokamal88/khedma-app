'use strict';

/** @type {import('sequelize-cli').QueryInterface} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      INSERT INTO member_profiles (church_id, church_member_id, gender, birth_date, created_at, updated_at)
      SELECT c.church_id, c.id, NULL, NULL, NOW(), NOW()
      FROM church_members c
      LEFT JOIN member_profiles p ON p.church_member_id = c.id
      WHERE p.id IS NULL
    `);
  },

  down: async () => {},
};
