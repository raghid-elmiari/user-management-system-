package com.rbac.controller;

import com.rbac.dto.request.CreateRoleRequest;
import com.rbac.dto.request.MoveRoleRequest;
import com.rbac.dto.request.UpdateRolePermissionsRequest;
import com.rbac.dto.request.ValidateHierarchyRequest;
import com.rbac.dto.response.RolePermissionsResponse;
import com.rbac.dto.response.RoleResponse;
import com.rbac.dto.response.RoleTreeResponse;
import com.rbac.service.RoleService;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    // ── Basic CRUD ──────────────────────────────────────────────────────

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

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_role:write')")
    public ResponseEntity<RoleResponse> updateRole(
            @PathVariable UUID id,
            @RequestBody CreateRoleRequest request) {
        return ResponseEntity.ok(roleService.updateRole(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_role:delete')")
    public ResponseEntity<Void> deleteRole(@PathVariable UUID id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{roleName}/permissions")
    @PreAuthorize("hasAuthority('PERMISSION_permission:write')")
    public ResponseEntity<RoleResponse> updateRolePermissions(
            @PathVariable String roleName,
            @RequestBody UpdateRolePermissionsRequest request) {
        return ResponseEntity.ok(roleService.updateRolePermissions(roleName, request));
    }

    // ── Hierarchy ───────────────────────────────────────────────────────

    @GetMapping("/tree")
    @PreAuthorize("hasAuthority('PERMISSION_role:read') or hasAuthority('PERMISSION_hierarchy:read')")
    public ResponseEntity<List<RoleTreeResponse>> getRoleTree() {
        return ResponseEntity.ok(roleService.getRoleTree());
    }

    @GetMapping("/{id}/children")
    @PreAuthorize("hasAuthority('PERMISSION_role:read') or hasAuthority('PERMISSION_hierarchy:read')")
    public ResponseEntity<List<RoleResponse>> getChildren(@PathVariable UUID id) {
        return ResponseEntity.ok(roleService.getChildRoles(id));
    }

    @PutMapping("/{id}/move")
    @PreAuthorize("hasAuthority('PERMISSION_role:write')")
    public ResponseEntity<RoleResponse> moveRole(
            @PathVariable UUID id,
            @RequestBody MoveRoleRequest request) {
        return ResponseEntity.ok(roleService.moveRole(id, request));
    }

    @PostMapping("/validate-hierarchy")
    @PreAuthorize("hasAuthority('PERMISSION_role:read') or hasAuthority('PERMISSION_hierarchy:read')")
    public ResponseEntity<Map<String, Object>> validateHierarchy(
            @RequestBody ValidateHierarchyRequest request) {
        return ResponseEntity.ok(
                roleService.validateHierarchy(request.getRoleId(), request.getProposedParentRoleId()));
    }

    // ── Permission Views ────────────────────────────────────────────────

    @GetMapping("/{id}/permissions/direct")
    @PreAuthorize("hasAuthority('PERMISSION_role:read') or hasAuthority('PERMISSION_permission:read')")
    public ResponseEntity<RolePermissionsResponse> getDirectPermissions(@PathVariable UUID id) {
        return ResponseEntity.ok(roleService.getDirectPermissions(id));
    }

    @GetMapping("/{id}/permissions/inherited")
    @PreAuthorize("hasAuthority('PERMISSION_role:read') or hasAuthority('PERMISSION_permission:read')")
    public ResponseEntity<RolePermissionsResponse> getInheritedPermissions(@PathVariable UUID id) {
        return ResponseEntity.ok(roleService.getInheritedPermissions(id));
    }

    @GetMapping("/{id}/permissions/effective")
    @PreAuthorize("hasAuthority('PERMISSION_role:read') or hasAuthority('PERMISSION_permission:read')")
    public ResponseEntity<RolePermissionsResponse> getEffectivePermissions(@PathVariable UUID id) {
        return ResponseEntity.ok(roleService.getEffectivePermissions(id));
    }
}