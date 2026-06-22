package com.rbac.service;

import com.rbac.domain.Role;
import com.rbac.domain.RolePermission;
import com.rbac.domain.RolePermissionId;
import com.rbac.domain.Permission;
import com.rbac.dto.request.CreateRoleRequest;
import com.rbac.dto.request.MoveRoleRequest;
import com.rbac.dto.request.UpdateRolePermissionsRequest;
import com.rbac.dto.response.RolePermissionsResponse;
import com.rbac.dto.response.RoleResponse;
import com.rbac.dto.response.RoleTreeResponse;
import com.rbac.exception.CyclicHierarchyException;
import com.rbac.exception.DuplicateResourceException;
import com.rbac.exception.ResourceNotFoundException;
import com.rbac.mapper.RoleMapper;
import com.rbac.repository.PermissionRepository;
import com.rbac.repository.RolePermissionRepository;
import com.rbac.repository.RoleRepository;
import com.rbac.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserRoleRepository userRoleRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "roles", key = "'list'")
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "roles", key = "'tree'")
    public List<RoleTreeResponse> getRoleTree() {
        List<Role> roots = roleRepository.findByParentRoleIsNull();
        return roots.stream()
                .map(this::buildTreeNode)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> getChildRoles(UUID parentId) {
        roleRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + parentId));
        return roleRepository.findByParentRoleId(parentId).stream()
                .map(roleMapper::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────
    // PERMISSION VIEWS
    // ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RolePermissionsResponse getDirectPermissions(UUID roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + roleId));
        List<String> direct = extractDirectPermissions(role);
        return RolePermissionsResponse.builder()
                .roleId(role.getId())
                .roleName(role.getName())
                .directPermissions(direct)
                .inheritedPermissions(Collections.emptyList())
                .effectivePermissions(direct)
                .build();
    }

    @Transactional(readOnly = true)
    public RolePermissionsResponse getInheritedPermissions(UUID roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + roleId));
        List<String> inherited = collectInheritedPermissions(role);
        return RolePermissionsResponse.builder()
                .roleId(role.getId())
                .roleName(role.getName())
                .directPermissions(Collections.emptyList())
                .inheritedPermissions(inherited)
                .effectivePermissions(inherited)
                .build();
    }

    @Transactional(readOnly = true)
    public RolePermissionsResponse getEffectivePermissions(UUID roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + roleId));
        List<String> direct    = extractDirectPermissions(role);
        List<String> inherited = collectInheritedPermissions(role);
        List<String> effective = new ArrayList<>(new LinkedHashSet<String>() {{
            addAll(direct);
            addAll(inherited);
        }});
        return RolePermissionsResponse.builder()
                .roleId(role.getId())
                .roleName(role.getName())
                .directPermissions(direct)
                .inheritedPermissions(inherited)
                .effectivePermissions(effective)
                .build();
    }

    /**
     * Returns the flat set of effective permission names for a role.
     * Used by AuthService when building JWT claims.
     */
    @Transactional(readOnly = true)
    public Set<String> computeEffectivePermissionNames(Role role) {
        Set<String> result = new LinkedHashSet<>();
        result.addAll(extractDirectPermissions(role));
        result.addAll(collectInheritedPermissions(role));
        return result;
    }

    /**
     * Resolves the closure of roles reachable from a user's direct roles by walking
     * DOWN the parent->child tree (a role's holder also effectively holds every
     * descendant role, e.g. ROLE_ADMIN -> ROLE_MANAGER -> ROLE_USER).
     * Used by AuthService when building JWT claims.
     */
    @Transactional(readOnly = true)
    public Set<Role> getEffectiveRoleClosure(Set<Role> directRoles) {
        Set<Role> closure = new HashSet<>();
        for (Role role : directRoles) {
            collectDescendantsRecursive(role, closure);
        }
        return closure;
    }

    private void collectDescendantsRecursive(Role role, Set<Role> closure) {
        if (!closure.add(role)) return;
        Role reloaded = roleRepository.findById(role.getId()).orElse(role);
        for (Role child : reloaded.getChildRoles()) {
            collectDescendantsRecursive(child, closure);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // CREATE / UPDATE / DELETE
    // ─────────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = {"roles", "dashboard"}, allEntries = true)
    public RoleResponse createRole(CreateRoleRequest request) {
        if (roleRepository.findByName(request.getName()).isPresent()) {
            throw new DuplicateResourceException("Role already exists with name " + request.getName());
        }

        Role parentRole = null;
        if (request.getParentRoleId() != null) {
            parentRole = roleRepository.findById(request.getParentRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parent role not found with id " + request.getParentRoleId()));
        }

        Role role = Role.builder()
                .name(request.getName())
                .description(request.getDescription())
                .parentRole(parentRole)
                .build();

        Role saved = roleRepository.save(role);
        return roleMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = {"roles", "dashboard"}, allEntries = true)
    public RoleResponse updateRole(UUID id, CreateRoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + id));

        // Duplicate name check (excluding self)
        if (roleRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new DuplicateResourceException("Another role already exists with name " + request.getName());
        }

        role.setName(request.getName());
        role.setDescription(request.getDescription());

        // Update parent if supplied
        if (request.getParentRoleId() != null) {
            if (request.getParentRoleId().equals(id)) {
                throw new CyclicHierarchyException("A role cannot be its own parent.");
            }
            validateNoCircle(id, request.getParentRoleId());
            Role newParent = roleRepository.findById(request.getParentRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parent role not found with id " + request.getParentRoleId()));
            role.setParentRole(newParent);
        } else {
            // Explicit null → promote to root
            role.setParentRole(null);
        }

        Role saved = roleRepository.save(role);
        return roleMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = {"roles", "dashboard"}, allEntries = true)
    public RoleResponse moveRole(UUID roleId, MoveRoleRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + roleId));

        UUID newParentId = request.getNewParentRoleId();

        if (newParentId == null) {
            // Move to root
            role.setParentRole(null);
        } else {
            if (newParentId.equals(roleId)) {
                throw new CyclicHierarchyException("A role cannot be its own parent.");
            }
            validateNoCircle(roleId, newParentId);
            Role newParent = roleRepository.findById(newParentId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Target parent role not found with id " + newParentId));
            role.setParentRole(newParent);
        }

        Role saved = roleRepository.save(role);
        return roleMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = {"roles", "dashboard"}, allEntries = true)
    public void deleteRole(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + id));

        // Block deletion if this role has children — caller must re-parent or delete children first
        if (!role.getChildRoles().isEmpty()) {
            String childNames = role.getChildRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.joining(", "));
            throw new IllegalStateException(
                    "Cannot delete role '" + role.getName() + "' because it has child roles: [" + childNames + "]. " +
                    "Please re-parent or delete the child roles first.");
        }

        // Remove FK references
        userRoleRepository.deleteAllByRoleId(role.getId());

        roleRepository.delete(role);
    }

    @Transactional
    @CacheEvict(value = {"roles", "dashboard"}, allEntries = true)
    public RoleResponse updateRolePermissions(String roleName, UpdateRolePermissionsRequest request) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with name " + roleName));

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

        role.getRolePermissions().clear();
        role.getRolePermissions().addAll(updatedPermissions);

        Role savedRole = roleRepository.saveAndFlush(role);
        return roleMapper.toResponse(savedRole);
    }

    // ─────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────

    /**
     * Validates a proposed parent assignment without applying it.
     * Returns a map with "valid" (boolean) and optionally "error" (String).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> validateHierarchy(UUID roleId, UUID proposedParentId) {
        Map<String, Object> result = new LinkedHashMap<>();

        if (proposedParentId == null) {
            result.put("valid", true);
            result.put("message", "Moving to root is always valid.");
            return result;
        }

        if (roleId != null && roleId.equals(proposedParentId)) {
            result.put("valid", false);
            result.put("error", "A role cannot be its own parent.");
            return result;
        }

        if (roleId != null) {
            try {
                validateNoCircle(roleId, proposedParentId);
            } catch (CyclicHierarchyException e) {
                result.put("valid", false);
                result.put("error", e.getMessage());
                return result;
            }
        }

        boolean parentExists = roleRepository.existsById(proposedParentId);
        if (!parentExists) {
            result.put("valid", false);
            result.put("error", "Proposed parent role does not exist.");
            return result;
        }

        result.put("valid", true);
        result.put("message", "Hierarchy assignment is valid.");
        return result;
    }

    // ─────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────

    /** Throws CyclicHierarchyException if making roleId a child of proposedParentId would create a cycle. */
    private void validateNoCircle(UUID roleId, UUID proposedParentId) {
        Set<UUID> visited = new HashSet<>();
        UUID current = proposedParentId;
        while (current != null) {
            if (visited.contains(current)) break; // safety for existing bad data
            if (current.equals(roleId)) {
                throw new CyclicHierarchyException(
                        "This assignment would create a circular hierarchy. " +
                        "The proposed parent is already a descendant of this role.");
            }
            visited.add(current);
            UUID finalCurrent = current;
            current = roleRepository.findById(finalCurrent)
                    .map(r -> r.getParentRole() != null ? r.getParentRole().getId() : null)
                    .orElse(null);
        }
    }

    /** Recursively builds a RoleTreeResponse node. */
    private RoleTreeResponse buildTreeNode(Role role) {
        List<String> directPerms = extractDirectPermissions(role);
        List<RoleTreeResponse> children = role.getChildRoles().stream()
                .sorted(Comparator.comparing(Role::getName))
                .map(this::buildTreeNode)
                .collect(Collectors.toList());

        return RoleTreeResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .parentRoleId(role.getParentRole() != null ? role.getParentRole().getId() : null)
                .parentRoleName(role.getParentRole() != null ? role.getParentRole().getName() : null)
                .directPermissions(directPerms)
                .children(children)
                .build();
    }

    /** Extracts direct permissions from a role's rolePermissions set. */
    private List<String> extractDirectPermissions(Role role) {
        if (role.getRolePermissions() == null) return Collections.emptyList();
        return role.getRolePermissions().stream()
                .map(rp -> rp.getPermission().getName())
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * Walks DOWN the child chain and collects permissions from all descendants.
     * A role's holder also effectively holds every descendant role
     * (e.g. ROLE_ADMIN -> ROLE_MANAGER -> ROLE_USER means admin inherits manager's
     * and user's permissions). Uses a visited set to guard against cycles in legacy data.
     */
    private List<String> collectInheritedPermissions(Role role) {
        Set<String> inherited = new LinkedHashSet<>();
        Set<UUID> visited = new HashSet<>();
        visited.add(role.getId());
        Deque<Role> queue = new ArrayDeque<>(role.getChildRoles());
        while (!queue.isEmpty()) {
            Role current = queue.poll();
            if (current == null || !visited.add(current.getId())) continue;
            Role reloaded = roleRepository.findById(current.getId()).orElse(current);
            if (reloaded.getRolePermissions() != null) {
                reloaded.getRolePermissions().stream()
                        .map(rp -> rp.getPermission().getName())
                        .forEach(inherited::add);
            }
            queue.addAll(reloaded.getChildRoles());
        }
        return new ArrayList<>(inherited);
    }
}