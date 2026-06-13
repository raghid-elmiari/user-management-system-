package com.rbac.controller;

import com.rbac.dto.request.AssignRoleRequest;
import com.rbac.dto.request.CreateUserRequest;
import com.rbac.dto.request.UpdateUserRequest;
import com.rbac.dto.response.UserResponse;
import com.rbac.service.UserService;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERMISSION_user:read')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERMISSION_user:write')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_user:write')")
    public ResponseEntity<UserResponse> updateUser(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateProfile(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_user:delete')")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('PERMISSION_user:write')")
    public ResponseEntity<UserResponse> updateStatus(@PathVariable UUID id, @RequestParam boolean active) {
        return ResponseEntity.ok(userService.updateStatus(id, active));
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('PERMISSION_role:write')")
    public ResponseEntity<UserResponse> assignRole(@PathVariable UUID id, @Valid @RequestBody AssignRoleRequest request) {
        return ResponseEntity.ok(userService.assignRole(id, request));
    }

    @DeleteMapping("/{id}/roles/{roleId}")
    @PreAuthorize("hasAuthority('PERMISSION_role:write')")
    public ResponseEntity<UserResponse> removeRole(@PathVariable UUID id, @PathVariable UUID roleId) {
        return ResponseEntity.ok(userService.removeRole(id, roleId));
    }
}

