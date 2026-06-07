package com.rbac.dto.request;

import javax.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateRoleRequest {

    @NotBlank
    private String name;

    private String description;
}

