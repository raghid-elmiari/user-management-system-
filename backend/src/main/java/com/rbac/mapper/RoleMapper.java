package com.rbac.mapper;

import com.rbac.domain.Role;
import com.rbac.dto.response.RoleResponse;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class RoleMapper {

    public RoleResponse toResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .permissions(role.getRolePermissions().stream()
                        .map(rolePermission -> rolePermission.getPermission().getName())
                        .collect(Collectors.toList()))
                .build();
    }
}

