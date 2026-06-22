package com.rbac.repository;

import com.rbac.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(String name);

    /** All roles that are direct children of the given parent. */
    List<Role> findByParentRoleId(UUID parentRoleId);

    /** All root-level roles (no parent). */
    List<Role> findByParentRoleIsNull();

    /** Check if a role name exists (excluding a specific ID — useful for update validation). */
    @Query("SELECT COUNT(r) > 0 FROM Role r WHERE r.name = :name AND r.id <> :excludeId")
    boolean existsByNameAndIdNot(@Param("name") String name, @Param("excludeId") UUID excludeId);
}
