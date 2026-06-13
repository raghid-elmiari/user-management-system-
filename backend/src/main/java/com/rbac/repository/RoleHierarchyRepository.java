package com.rbac.repository;

import com.rbac.domain.RoleHierarchy;
import com.rbac.domain.RoleHierarchyId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface RoleHierarchyRepository extends JpaRepository<RoleHierarchy, RoleHierarchyId> {

    @Query("SELECT rh.parentRole.id FROM RoleHierarchy rh WHERE rh.childRole.id = :childRoleId")
    List<UUID> findParentRoleIdsByChildRoleId(UUID childRoleId);

    @Query("SELECT rh.childRole.id FROM RoleHierarchy rh WHERE rh.parentRole.id = :parentRoleId")
    List<UUID> findChildRoleIdsByParentRoleId(UUID parentRoleId);
}

