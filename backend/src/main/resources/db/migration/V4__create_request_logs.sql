CREATE TABLE request_logs (
    id BINARY(16) NOT NULL,
    method VARCHAR(20) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    status INT NULL,
    username VARCHAR(255) NULL,
    ip_address VARCHAR(100) NULL,
    duration_ms BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;