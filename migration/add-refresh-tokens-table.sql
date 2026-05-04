-- Adds refresh_tokens table for refresh token rotation.
-- Target DB: visionart (configure in your MySQL client/session)

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token_hash VARCHAR(64) NOT NULL,
  admin_id CHAR(36) NOT NULL,
  family_id VARCHAR(36) NOT NULL,
  device_info VARCHAR(500) NULL,
  ip_address VARCHAR(45) NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_token_hash (token_hash),
  KEY idx_refresh_tokens_admin_id (admin_id),
  KEY idx_refresh_tokens_family_id (family_id),
  KEY idx_refresh_tokens_expires_at (expires_at),
  CONSTRAINT fk_refresh_tokens_admin
    FOREIGN KEY (admin_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- Cleanup
-- NOTE: Stored procedures may fail on some MariaDB installs if system tables need upgrade
-- (e.g. mysql.proc mismatch). Use the Node cleanup script instead:
--   node backoffice/scripts/cleanup-expired-refresh-tokens.js
--
-- Or run manually when needed:
--   DELETE FROM refresh_tokens WHERE expires_at < NOW();

