package com.rbac.repository;

import com.rbac.domain.RolePermission;
import com.rbac.domain.RolePermissionId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermissionId> {
}

