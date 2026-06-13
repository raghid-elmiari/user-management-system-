package com.rbac.dto.request;

import lombok.Data;
import java.util.UUID;

@Data
public class AssignRoleRequest {

    private UUID roleId;

    private String roleName;
}

