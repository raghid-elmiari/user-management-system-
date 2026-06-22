package com.rbac.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Recursive tree node representing a role and all its descendants.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RoleTreeResponse {

    private UUID id;
    private String name;
    private String description;
    private UUID parentRoleId;
    private String parentRoleName;

    /** Recursively nested children. Empty list for leaf nodes. */
    @Builder.Default
    private List<RoleTreeResponse> children = new java.util.ArrayList<>();

    /** Direct permissions assigned to this role only. */
    private List<String> directPermissions;
}
