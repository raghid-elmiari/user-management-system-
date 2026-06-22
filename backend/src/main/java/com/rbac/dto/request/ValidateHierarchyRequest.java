package com.rbac.dto.request;

import lombok.Data;

import java.util.UUID;

/**
 * Request body for validating a proposed parent assignment before applying it.
 */
@Data
public class ValidateHierarchyRequest {

    /** The role to re-parent. */
    private UUID roleId;

    /** The proposed new parent role. Null means "move to root". */
    private UUID proposedParentRoleId;
}
