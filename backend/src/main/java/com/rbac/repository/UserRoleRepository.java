package com.rbac.repository;

import com.rbac.domain.UserRole;
import com.rbac.domain.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
}

