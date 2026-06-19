package com.rbac.controller;

import com.rbac.dto.request.CreatePermissionRequest;
import com.rbac.dto.response.PermissionResponse;
import com.rbac.service.PermissionService;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERMISSION_permission:read')")
    public ResponseEntity<List<PermissionResponse>> listPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERMISSION_permission:write')")
    public ResponseEntity<PermissionResponse> createPermission(@Valid @RequestBody CreatePermissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(permissionService.createPermission(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_permission:delete')")
    public ResponseEntity<Void> deletePermission(@PathVariable UUID id) {
        permissionService.deletePermission(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_permission:write')")
    public ResponseEntity<PermissionResponse> updatePermission(
        @PathVariable UUID id,
        @Valid @RequestBody CreatePermissionRequest request) {
    return ResponseEntity.ok(permissionService.updatePermission(id, request));
}
}

