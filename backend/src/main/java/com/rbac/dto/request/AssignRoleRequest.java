package com.rbac.dto.request;

import javax.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignRoleRequest {

    @NotNull
    private UUID roleId;
}

