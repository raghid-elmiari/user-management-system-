package com.rbac.repository;

import com.rbac.domain.RoleHierarchy;
import com.rbac.domain.RoleHierarchyId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RoleHierarchyRepository extends JpaRepository<RoleHierarchy, RoleHierarchyId> {

    @Query("SELECT rh.parentRole.id FROM RoleHierarchy rh WHERE rh.childRole.id = :childRoleId")
    List<UUID> findParentRoleIdsByChildRoleId(UUID childRoleId);

    @Query("SELECT rh.childRole.id FROM RoleHierarchy rh WHERE rh.parentRole.id = :parentRoleId")
    List<UUID> findChildRoleIdsByParentRoleId(UUID parentRoleId);

    // BUG FIX: needed by RoleService.deleteRole() to remove role_hierarchy rows
    // where the deleted role appears as either parent or child
    @Modifying
    @Query("DELETE FROM RoleHierarchy rh WHERE rh.parentRole.id = :roleId OR rh.childRole.id = :roleId")
    void deleteByRoleId(@Param("roleId") UUID roleId);
}