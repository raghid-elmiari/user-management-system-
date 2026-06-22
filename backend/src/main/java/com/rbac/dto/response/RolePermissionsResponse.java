package com.rbac.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Response containing the three tiers of permissions for a role:
 * - direct: permissions explicitly assigned to this role
 * - inherited: permissions coming from descendant roles via the hierarchy
 * - effective: union of direct + inherited (what is actually enforced)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermissionsResponse {

    private UUID roleId;
    private String roleName;

    /** Permissions explicitly assigned to this role only. */
    private List<String> directPermissions;

    /** Permissions inherited from descendant roles in the hierarchy. */
    private List<String> inheritedPermissions;

    /**
     * Union of direct + inherited. This is what the RBAC engine enforces.
     * Always use effectivePermissions for authorization checks.
     */
    private List<String> effectivePermissions;
}
