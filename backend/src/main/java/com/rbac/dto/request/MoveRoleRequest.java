package com.rbac.dto.request;

import lombok.Data;

import java.util.UUID;

/**
 * Request body for moving a role to a new parent in the hierarchy.
 * Setting newParentRoleId to null moves the role to the root level.
 */
@Data
public class MoveRoleRequest {

    /** The new parent role ID, or null to make this role a root. */
    private UUID newParentRoleId;
}
