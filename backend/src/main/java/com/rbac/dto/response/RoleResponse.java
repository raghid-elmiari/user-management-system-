package com.rbac.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {
    private UUID id;
    private String name;
    private String description;

    /** Parent role info (null for root roles). */
    private UUID parentRoleId;
    private String parentRoleName;

    /** IDs of direct child roles. */
    private List<UUID> childRoleIds;

    /** Permissions directly assigned to this role. */
    private List<String> permissions;

    /** All permissions including those inherited from ancestor roles. */
    private List<String> effectivePermissions;
}
