package com.rbac.dto.request;

import javax.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateRoleRequest {

    @NotBlank
    private String name;

    private String description;

    /**
     * Optional: the parent role in the hierarchy tree.
     * Null means this role is a root-level role.
     */
    private UUID parentRoleId;
}
