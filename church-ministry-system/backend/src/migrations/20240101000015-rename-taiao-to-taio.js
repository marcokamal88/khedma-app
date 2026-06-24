'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.sequelize.query('RENAME TABLE taiao_transactions TO taio_transactions');
    await queryInterface.sequelize.query('ALTER TABLE tasks CHANGE COLUMN taiao_points taio_points INT DEFAULT 0');
    await queryInterface.sequelize.query('ALTER TABLE store_redemptions CHANGE COLUMN taiao_transaction_id taio_transaction_id INTEGER NOT NULL');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.sequelize.query('RENAME TABLE taio_transactions TO taiao_transactions');
    await queryInterface.sequelize.query('ALTER TABLE tasks CHANGE COLUMN taio_points taiao_points INT DEFAULT 0');
    await queryInterface.sequelize.query('ALTER TABLE store_redemptions CHANGE COLUMN taio_transaction_id taiao_transaction_id INTEGER NOT NULL');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
};
