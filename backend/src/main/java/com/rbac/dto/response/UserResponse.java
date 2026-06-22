package com.rbac.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String username;
    private String name;
    private boolean active;
    private boolean emailVerified;
    private java.time.OffsetDateTime lastLogin;
    private java.time.OffsetDateTime createdAt;
    private List<String> roles;
}

