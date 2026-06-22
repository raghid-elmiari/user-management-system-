package com.rbac.mapper;

import com.rbac.domain.Role;
import com.rbac.dto.response.RoleResponse;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class RoleMapper {

    /**
     * Maps a Role entity to a RoleResponse.
     * Includes parent info, child IDs, and direct permissions.
     * Effective permissions are NOT populated here — call the service
     * when you need the full effective set (to avoid N+1 walks in list endpoints).
     */
    public RoleResponse toResponse(Role role) {
        List<String> directPermissions = role.getRolePermissions() == null
                ? new ArrayList<>()
                : role.getRolePermissions().stream()
                    .map(rp -> rp.getPermission().getName())
                    .collect(Collectors.toList());

        List<UUID> childIds = role.getChildRoles() == null
                ? new ArrayList<>()
                : role.getChildRoles().stream()
                    .map(Role::getId)
                    .collect(Collectors.toList());

        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .parentRoleId(role.getParentRole() != null ? role.getParentRole().getId() : null)
                .parentRoleName(role.getParentRole() != null ? role.getParentRole().getName() : null)
                .childRoleIds(childIds)
                .permissions(directPermissions)
                .build();
    }

    /**
     * Maps a Role to a RoleResponse with effective permissions pre-computed.
     */
    public RoleResponse toResponseWithEffective(Role role, List<String> effectivePermissions) {
        RoleResponse base = toResponse(role);
        base.setEffectivePermissions(effectivePermissions);
        return base;
    }
}
