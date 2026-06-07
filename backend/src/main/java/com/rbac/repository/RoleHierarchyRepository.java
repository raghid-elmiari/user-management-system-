package com.rbac.repository;

import com.rbac.domain.RoleHierarchy;
import com.rbac.domain.RoleHierarchyId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface RoleHierarchyRepository extends JpaRepository<RoleHierarchy, RoleHierarchyId> {

    @Query("SELECT rh.id.parentRoleId FROM RoleHierarchy rh WHERE rh.id.childRoleId = :childRoleId")
    List<UUID> findParentRoleIdsByChildRoleId(UUID childRoleId);

    @Query("SELECT rh.id.childRoleId FROM RoleHierarchy rh WHERE rh.id.parentRoleId = :parentRoleId")
    List<UUID> findChildRoleIdsByParentRoleId(UUID parentRoleId);
}

