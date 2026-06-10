package com.rbac.dto.request;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.util.List;

@Data
public class UpdateRolePermissionsRequest {
    @NotNull
    private List<String> permissions;
}