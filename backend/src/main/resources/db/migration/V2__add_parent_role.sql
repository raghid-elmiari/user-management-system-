-- V2: Add parent_role_id to roles table for tree-based hierarchy
-- This enables parent/child self-referencing on the Role entity

ALTER TABLE roles
    ADD COLUMN parent_role_id BINARY(16) NULL AFTER description;

ALTER TABLE roles
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE roles
    ADD CONSTRAINT fk_roles_parent
        FOREIGN KEY (parent_role_id) REFERENCES roles (id)
        ON DELETE SET NULL;

CREATE INDEX idx_roles_parent_role_id ON roles (parent_role_id);
