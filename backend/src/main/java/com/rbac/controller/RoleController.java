package com.rbac.controller;

import com.rbac.dto.request.CreateRoleRequest;
import com.rbac.dto.request.UpdateRolePermissionsRequest;
import com.rbac.dto.response.RoleResponse;
import com.rbac.service.RoleService;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    
    @GetMapping
    @PreAuthorize("hasAuthority('PERMISSION_role:read') or hasAuthority('PERMISSION_permission:read') or hasAuthority('PERMISSION_hierarchy:read')")
    public ResponseEntity<List<RoleResponse>> getRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERMISSION_role:write')")
    public ResponseEntity<RoleResponse> createRole(
            @Valid @RequestBody CreateRoleRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roleService.createRole(request));
    }

    @PutMapping("/{roleName}/permissions")
    @PreAuthorize("hasAuthority('PERMISSION_permission:write')")
    public ResponseEntity<RoleResponse> updateRolePermissions(
            @PathVariable String roleName,
            @RequestBody UpdateRolePermissionsRequest request) {

        return ResponseEntity.ok(
                roleService.updateRolePermissions(roleName, request)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_role:write')")
    public ResponseEntity<RoleResponse> updateRole(
            @PathVariable UUID id,
            @RequestBody CreateRoleRequest request) {

        return ResponseEntity.ok(
                roleService.updateRole(id, request)
        );
    }

@DeleteMapping("/{id}")
@PreAuthorize("hasAuthority('PERMISSION_role:delete')")
public ResponseEntity<Void> deleteRole(@PathVariable UUID id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }
}