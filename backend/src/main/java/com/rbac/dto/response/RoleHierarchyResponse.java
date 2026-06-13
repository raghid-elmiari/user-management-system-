package com.rbac.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class RoleHierarchyResponse {
    private UUID parentRoleId;
    private UUID childRoleId;
    private String parentRoleName;
    private String childRoleName;
}