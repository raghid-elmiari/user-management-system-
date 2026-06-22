-- The many-to-many role_hierarchy table has been superseded by the single-parent
-- parent_role_id column on roles (see V2__add_parent_role.sql). All hierarchy reads,
-- writes, and permission inheritance now go through that column.
DROP TABLE IF EXISTS role_hierarchy;
