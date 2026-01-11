-- Database
DROP DATABASE IF EXISTS EntrySense;
CREATE DATABASE EntrySense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE EntrySense;

-- Devices Table
CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  arm_status BOOLEAN NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- Accounts Table
CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  device_id INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_accounts_device
    FOREIGN KEY (device_id) REFERENCES devices(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- History Table
CREATE TABLE history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  event ENUM('OPEN', 'CLOSE', 'ARM', 'DISARM') NOT NULL,
  description VARCHAR(255) NULL,
  CONSTRAINT fk_history_device
    FOREIGN KEY (device_id) REFERENCES devices(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX idx_history_device_time (device_id, created_at)
) ENGINE=InnoDB;
