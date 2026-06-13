package com.rbac.dto.request;

import javax.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePermissionRequest {

    @NotBlank
    private String resource;

    @NotBlank
    private String action;

    @NotBlank
    private String name;

    private String description;
}

