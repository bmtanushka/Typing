-- KeyQuest database schema (MySQL 5.7+/8, MariaDB 10.4+). Safe to run more than once.
-- Import via phpMyAdmin in Hostinger hPanel, or run: php install/migrate.php

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email            VARCHAR(190) NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    display_name     VARCHAR(60)  NOT NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at    DATETIME     NULL,
    settings_json    TEXT         NULL,
    xp               INT UNSIGNED NOT NULL DEFAULT 0,
    streak_current   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    streak_best      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    streak_last_day  DATE         NULL,
    skipped_json     TEXT         NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lesson_progress (
    user_id        INT UNSIGNED NOT NULL,
    lesson_id      VARCHAR(64)  NOT NULL,
    stars          TINYINT UNSIGNED NOT NULL DEFAULT 0,
    best_wpm       DECIMAL(6,1) NOT NULL DEFAULT 0,
    best_accuracy  DECIMAL(5,1) NOT NULL DEFAULT 0,
    attempts       INT UNSIGNED NOT NULL DEFAULT 0,
    completed_at   DATETIME     NULL,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, lesson_id),
    CONSTRAINT fk_lp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS results (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id      INT UNSIGNED NOT NULL,
    client_id    VARCHAR(64)  NOT NULL,
    type         ENUM('lesson','test','game','practice') NOT NULL,
    ref_id       VARCHAR(64)  NOT NULL DEFAULT '',
    wpm          DECIMAL(6,1) NOT NULL DEFAULT 0,
    raw_wpm      DECIMAL(6,1) NOT NULL DEFAULT 0,
    accuracy     DECIMAL(5,1) NOT NULL DEFAULT 0,
    duration_ms  INT UNSIGNED NOT NULL DEFAULT 0,
    chars        INT UNSIGNED NOT NULL DEFAULT 0,
    stars        TINYINT UNSIGNED NOT NULL DEFAULT 0,
    score        INT UNSIGNED NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_results_client (user_id, client_id),
    KEY idx_results_user_time (user_id, created_at),
    CONSTRAINT fk_results_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS key_stats (
    user_id         INT UNSIGNED NOT NULL,
    key_char        VARCHAR(4)   NOT NULL,
    attempts        INT UNSIGNED NOT NULL DEFAULT 0,
    errors          INT UNSIGNED NOT NULL DEFAULT 0,
    latency_total   BIGINT UNSIGNED NOT NULL DEFAULT 0,
    latency_count   INT UNSIGNED NOT NULL DEFAULT 0,
    avg_latency_ms  INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, key_char),
    CONSTRAINT fk_ks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS badges (
    user_id    INT UNSIGNED NOT NULL,
    badge_id   VARCHAR(64)  NOT NULL,
    earned_at  DATETIME     NOT NULL,
    PRIMARY KEY (user_id, badge_id),
    CONSTRAINT fk_badges_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_scores (
    user_id     INT UNSIGNED NOT NULL,
    game_id     VARCHAR(64)  NOT NULL,
    best_score  INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_id),
    CONSTRAINT fk_gs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
    email       VARCHAR(190) NOT NULL,
    token_hash  CHAR(64)     NOT NULL,
    expires_at  DATETIME     NOT NULL,
    PRIMARY KEY (token_hash),
    KEY idx_pr_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    action        VARCHAR(20)  NOT NULL DEFAULT 'login',
    ip            VARCHAR(45)  NOT NULL,
    email         VARCHAR(190) NOT NULL DEFAULT '',
    attempted_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_la_ip (action, ip, attempted_at),
    KEY idx_la_email (action, email, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guest_merges (
    user_id    INT UNSIGNED NOT NULL,
    merge_id   CHAR(36)     NOT NULL,
    merged_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, merge_id),
    CONSTRAINT fk_gm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
    id          VARCHAR(128) NOT NULL,
    data        MEDIUMBLOB   NOT NULL,
    expires_at  INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY idx_sessions_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=ascii COLLATE=ascii_bin;
