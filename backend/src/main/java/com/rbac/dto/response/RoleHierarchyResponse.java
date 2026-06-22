package com.rbac.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleHierarchyResponse {
    private UUID parentRoleId;
    private UUID childRoleId;
    private String parentRoleName;
    private String childRoleName;
}