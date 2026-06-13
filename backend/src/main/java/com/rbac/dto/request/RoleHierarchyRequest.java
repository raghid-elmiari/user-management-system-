package com.rbac.dto.request;

import javax.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class RoleHierarchyRequest {

    @NotNull
    private UUID parentRoleId;

    @NotNull
    private UUID childRoleId;
}

