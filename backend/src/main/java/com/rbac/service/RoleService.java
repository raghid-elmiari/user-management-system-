package com.rbac.service;

import com.rbac.domain.Role;
import com.rbac.domain.RolePermission;
import com.rbac.domain.RolePermissionId;
import com.rbac.domain.Permission;
import com.rbac.dto.request.CreateRoleRequest;
import com.rbac.dto.request.UpdateRolePermissionsRequest;
import com.rbac.dto.response.RoleResponse;
import com.rbac.exception.DuplicateResourceException;
import com.rbac.exception.ResourceNotFoundException;
import com.rbac.mapper.RoleMapper;
import com.rbac.repository.PermissionRepository;
import com.rbac.repository.RoleHierarchyRepository;
import com.rbac.repository.RolePermissionRepository;
import com.rbac.repository.RoleRepository;
import com.rbac.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;  // ← added
    private final UserRoleRepository userRoleRepository;              // ← added
    private final RoleHierarchyRepository roleHierarchyRepository;    // ← added

    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoleResponse createRole(CreateRoleRequest request) {
        if (roleRepository.findByName(request.getName()).isPresent()) {
            throw new DuplicateResourceException("Role already exists with name " + request.getName());
        }

        Role role = Role.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        Role saved = roleRepository.save(role);
        return roleMapper.toResponse(saved);
    }

    @Transactional
    public RoleResponse updateRolePermissions(String roleName, UpdateRolePermissionsRequest request) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with name " + roleName));

        // BUG FIX: explicitly delete all existing role-permission rows first.
        // Calling role.getRolePermissions().clear() + saveAndFlush() was unreliable
        // because Hibernate would match new RolePermission objects by composite PK
        // and skip the DELETE, leaving removed permissions in the database.
        rolePermissionRepository.deleteByRoleId(role.getId());
        rolePermissionRepository.flush();

        Set<RolePermission> updatedPermissions = new HashSet<>();
        for (String permissionName : request.getPermissions()) {
            Permission permission = permissionRepository.findByName(permissionName)
                    .orElseThrow(() -> new ResourceNotFoundException("Permission not found with name " + permissionName));

            RolePermission rolePermission = RolePermission.builder()
                    .id(new RolePermissionId(role.getId(), permission.getId()))
                    .role(role)
                    .permission(permission)
                    .build();
            updatedPermissions.add(rolePermission);
        }

        // Sync the in-memory collection so the returned response is accurate
        role.getRolePermissions().clear();
        role.getRolePermissions().addAll(updatedPermissions);

        Role savedRole = roleRepository.saveAndFlush(role);
        return roleMapper.toResponse(savedRole);
    }

    @Transactional
    public RoleResponse updateRole(UUID id, CreateRoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        role.setName(request.getName());
        role.setDescription(request.getDescription());

        Role saved = roleRepository.save(role);
        return roleMapper.toResponse(saved);
    }

    @Transactional
    public void deleteRole(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        // BUG FIX: remove all FK references to this role before deleting it.
        // Without these, the DELETE fails with a foreign-key constraint violation
        // because user_roles and role_hierarchy still point to this role.
        userRoleRepository.deleteAllByRoleId(role.getId());
        roleHierarchyRepository.deleteByRoleId(role.getId());

        roleRepository.delete(role);
    }
}