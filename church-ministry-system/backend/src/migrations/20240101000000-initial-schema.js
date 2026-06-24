'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Churches
    await queryInterface.createTable('churches', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      subdomain: { type: Sequelize.STRING(100), unique: true, allowNull: false },
      settings: { type: Sequelize.JSON, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // Users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      phone: { type: Sequelize.STRING(20), unique: true, allowNull: true },
      email: { type: Sequelize.STRING(255), unique: true, allowNull: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      full_name: { type: Sequelize.STRING(255), allowNull: false },
      avatar_url: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // Church Members
    await queryInterface.createTable('church_members', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'churches', key: 'id' } },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      joined_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('church_members', ['church_id', 'user_id'], { unique: true });
    await queryInterface.addIndex('church_members', ['church_id']);
    await queryInterface.addIndex('church_members', ['user_id']);

    // Roles
    await queryInterface.createTable('roles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.ENUM('servant','served_member','parent','sector_leader','priest'), unique: true, allowNull: false },
      label: { type: Sequelize.STRING(100), allowNull: false },
    });

    // Member Roles
    await queryInterface.createTable('member_roles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'church_members', key: 'id' } },
      role_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'roles', key: 'id' } },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      assigned_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('member_roles', ['church_member_id', 'role_id'], { unique: true });
    await queryInterface.addIndex('member_roles', ['church_id', 'role_id']);

    // Service Years
    await queryInterface.createTable('service_years', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'churches', key: 'id' } },
      label: { type: Sequelize.STRING(20), allowNull: false },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: false },
      is_current: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('service_years', ['church_id']);
    await queryInterface.addIndex('service_years', ['church_id', 'is_current']);

    // Sectors
    await queryInterface.createTable('sectors', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'churches', key: 'id' } },
      name: { type: Sequelize.STRING(255), allowNull: false },
      type: { type: Sequelize.ENUM('primary','preparatory','secondary','general'), defaultValue: 'general' },
      description: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('sectors', ['church_id']);

    // Services
    await queryInterface.createTable('services', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'churches', key: 'id' } },
      sector_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'sectors', key: 'id' } },
      name: { type: Sequelize.STRING(255), allowNull: false },
      schedule: { type: Sequelize.JSON, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('services', ['church_id']);
    await queryInterface.addIndex('services', ['sector_id']);

    // Stage Groups
    await queryInterface.createTable('stage_groups', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'services', key: 'id' } },
      name: { type: Sequelize.STRING(100), allowNull: false },
      stage_order: { type: Sequelize.TINYINT, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    });
    await queryInterface.addIndex('stage_groups', ['service_id']);
    await queryInterface.addIndex('stage_groups', ['church_id']);

    // Classes
    await queryInterface.createTable('classes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'services', key: 'id' } },
      stage_group_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'stage_groups', key: 'id' } },
      name: { type: Sequelize.STRING(255), allowNull: false },
      capacity: { type: Sequelize.INTEGER, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    });
    await queryInterface.addIndex('classes', ['service_id']);
    await queryInterface.addIndex('classes', ['stage_group_id']);
    await queryInterface.addIndex('classes', ['church_id']);

    // Enrollments
    await queryInterface.createTable('enrollments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'church_members', key: 'id' } },
      service_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'services', key: 'id' } },
      class_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'classes', key: 'id' } },
      stage_group_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'stage_groups', key: 'id' } },
      enrolled_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    });
    await queryInterface.addIndex('enrollments', ['church_member_id', 'service_id', 'service_year_id'], { unique: true });
    await queryInterface.addIndex('enrollments', ['church_id']);
    await queryInterface.addIndex('enrollments', ['service_id']);

    // Servant Assignments
    await queryInterface.createTable('servant_assignments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'church_members', key: 'id' } },
      service_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'services', key: 'id' } },
      class_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'classes', key: 'id' } },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      assigned_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('servant_assignments', ['church_member_id', 'service_id', 'service_year_id'], { unique: true });
    await queryInterface.addIndex('servant_assignments', ['church_id']);
    await queryInterface.addIndex('servant_assignments', ['service_id']);

    // Attendance Sessions
    await queryInterface.createTable('attendance_sessions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      service_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'services', key: 'id' } },
      session_type: { type: Sequelize.ENUM('service','event','meeting','activity'), allowNull: false },
      session_date: { type: Sequelize.DATEONLY, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      recorded_by: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('attendance_sessions', ['church_id', 'session_date']);
    await queryInterface.addIndex('attendance_sessions', ['service_id', 'session_date']);

    // Attendance Records
    await queryInterface.createTable('attendance_records', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      attendance_session_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'attendance_sessions', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM('present','absent','excused','late'), defaultValue: 'present' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      recorded_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('attendance_records', ['attendance_session_id', 'church_member_id'], { unique: true });
    await queryInterface.addIndex('attendance_records', ['church_id']);
    await queryInterface.addIndex('attendance_records', ['church_member_id']);

    // Preparations
    await queryInterface.createTable('preparations', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      servant_id: { type: Sequelize.INTEGER, allowNull: false },
      service_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'services', key: 'id' } },
      class_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'classes', key: 'id' } },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      lesson_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM('draft','submitted','under_review','approved','rejected'), defaultValue: 'draft' },
      reviewer_id: { type: Sequelize.INTEGER, allowNull: true },
      review_notes: { type: Sequelize.TEXT, allowNull: true },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('preparations', ['church_id']);
    await queryInterface.addIndex('preparations', ['servant_id']);
    await queryInterface.addIndex('preparations', ['church_id', 'status']);

    // Preparation Files
    await queryInterface.createTable('preparation_files', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      preparation_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'preparations', key: 'id' } },
      file_name: { type: Sequelize.STRING(255), allowNull: false },
      file_url: { type: Sequelize.STRING(500), allowNull: false },
      file_type: { type: Sequelize.ENUM('document','presentation','image','video','audio','other'), allowNull: false },
      file_size_bytes: { type: Sequelize.INTEGER, allowNull: true },
      uploaded_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('preparation_files', ['preparation_id']);

    // Tasks
    await queryInterface.createTable('tasks', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      service_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'services', key: 'id' } },
      class_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'classes', key: 'id' } },
      assigned_by: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      task_type: { type: Sequelize.ENUM('memorization','reading','hymn','assignment','other'), allowNull: false },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      taiao_points: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('tasks', ['church_id']);
    await queryInterface.addIndex('tasks', ['service_id']);
    await queryInterface.addIndex('tasks', ['due_date']);

    // Task Assignments
    await queryInterface.createTable('task_assignments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      task_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tasks', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM('pending','in_progress','completed','skipped'), defaultValue: 'pending' },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      verified_by: { type: Sequelize.INTEGER, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
    });
    await queryInterface.addIndex('task_assignments', ['task_id', 'church_member_id'], { unique: true });
    await queryInterface.addIndex('task_assignments', ['church_id']);
    await queryInterface.addIndex('task_assignments', ['church_member_id']);
    await queryInterface.addIndex('task_assignments', ['church_id', 'status']);

    // Taiao Transactions
    await queryInterface.createTable('taiao_transactions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      points: { type: Sequelize.INTEGER, allowNull: false },
      reason: { type: Sequelize.STRING(255), allowNull: false },
      source_type: { type: Sequelize.ENUM('task','attendance','manual','redemption','adjustment'), allowNull: false },
      source_id: { type: Sequelize.INTEGER, allowNull: true },
      assigned_by: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('taiao_transactions', ['church_id', 'church_member_id']);
    await queryInterface.addIndex('taiao_transactions', ['service_year_id', 'church_member_id']);

    // Store Items
    await queryInterface.createTable('store_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      image_url: { type: Sequelize.STRING(500), allowNull: true },
      point_cost: { type: Sequelize.INTEGER, allowNull: false },
      stock_quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('store_items', ['church_id']);

    // Store Redemptions
    await queryInterface.createTable('store_redemptions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      store_item_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'store_items', key: 'id' } },
      taiao_transaction_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'taiao_transactions', key: 'id' } },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      status: { type: Sequelize.ENUM('pending','fulfilled','cancelled'), defaultValue: 'pending' },
      redeemed_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      fulfilled_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('store_redemptions', ['church_id']);
    await queryInterface.addIndex('store_redemptions', ['church_member_id']);

    // Events
    await queryInterface.createTable('events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      service_year_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_years', key: 'id' } },
      name: { type: Sequelize.STRING(255), allowNull: false },
      event_type: { type: Sequelize.ENUM('trip','conference','choir','theater','festival','other'), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: false },
      location: { type: Sequelize.STRING(255), allowNull: true },
      registration_fee: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      max_capacity: { type: Sequelize.INTEGER, allowNull: true },
      registration_deadline: { type: Sequelize.DATEONLY, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('events', ['church_id']);
    await queryInterface.addIndex('events', ['church_id', 'start_date']);

    // Event Registrations
    await queryInterface.createTable('event_registrations', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      event_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'events', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM('registered','cancelled','attended'), defaultValue: 'registered' },
      registered_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      total_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      paid_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
    });
    await queryInterface.addIndex('event_registrations', ['event_id', 'church_member_id'], { unique: true });
    await queryInterface.addIndex('event_registrations', ['church_id']);

    // Payment Installments
    await queryInterface.createTable('payment_installments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      event_registration_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'event_registrations', key: 'id' } },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      due_date: { type: Sequelize.DATEONLY, allowNull: false },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      payment_method: { type: Sequelize.STRING(100), allowNull: true },
      receipt_url: { type: Sequelize.STRING(500), allowNull: true },
      recorded_by: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('payment_installments', ['event_registration_id']);
    await queryInterface.addIndex('payment_installments', ['church_id']);
    await queryInterface.addIndex('payment_installments', ['church_id', 'due_date']);

    // Families
    await queryInterface.createTable('families', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('families', ['church_id']);

    // Family Members
    await queryInterface.createTable('family_members', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      family_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'families', key: 'id' } },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      relation: { type: Sequelize.ENUM('parent','child','guardian'), allowNull: false },
    });
    await queryInterface.addIndex('family_members', ['family_id', 'church_member_id'], { unique: true });
    await queryInterface.addIndex('family_members', ['church_id']);

    // Sibling Pairs
    await queryInterface.createTable('sibling_pairs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      church_member_id_a: { type: Sequelize.INTEGER, allowNull: false },
      church_member_id_b: { type: Sequelize.INTEGER, allowNull: false },
    });
    await queryInterface.addIndex('sibling_pairs', ['church_member_id_a', 'church_member_id_b'], { unique: true });
    await queryInterface.addIndex('sibling_pairs', ['church_id']);

    // Notifications
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      church_id: { type: Sequelize.INTEGER, allowNull: false },
      church_member_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.ENUM('attendance','task','event','payment','general'), allowNull: false },
      source_type: { type: Sequelize.STRING(50), allowNull: true },
      source_id: { type: Sequelize.INTEGER, allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      sent_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      read_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('notifications', ['church_id', 'church_member_id', 'is_read']);
    await queryInterface.addIndex('notifications', ['church_id', 'sent_at']);

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },

  down: async (queryInterface, Sequelize) => {
    const tables = [
      'notifications', 'sibling_pairs', 'family_members', 'families',
      'payment_installments', 'event_registrations', 'events',
      'store_redemptions', 'store_items', 'taiao_transactions',
      'task_assignments', 'tasks', 'preparation_files', 'preparations',
      'attendance_records', 'attendance_sessions',
      'servant_assignments', 'enrollments',
      'classes', 'stage_groups', 'services', 'sectors',
      'service_years', 'member_roles', 'roles', 'church_members', 'users', 'churches',
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table);
    }
  },
};
