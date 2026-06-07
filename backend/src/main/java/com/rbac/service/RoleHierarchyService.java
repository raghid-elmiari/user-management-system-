package com.rbac.service;

import com.rbac.domain.Role;
import com.rbac.domain.RoleHierarchy;
import com.rbac.domain.RoleHierarchyId;
import com.rbac.exception.CyclicHierarchyException;
import com.rbac.exception.ResourceNotFoundException;
import com.rbac.repository.RoleHierarchyRepository;
import com.rbac.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RoleHierarchyService {

    private final RoleHierarchyRepository hierarchyRepository;
    private final RoleRepository roleRepository;

    @Transactional
    public void addHierarchyLink(UUID parentRoleId, UUID childRoleId) {
        if (parentRoleId.equals(childRoleId)) {
            throw new CyclicHierarchyException("A role cannot be a parent of itself.");
        }

        Role parent = roleRepository.findById(parentRoleId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent role not found with id " + parentRoleId));
        Role child = roleRepository.findById(childRoleId)
                .orElseThrow(() -> new ResourceNotFoundException("Child role not found with id " + childRoleId));

        // Cycle check: If childRoleId can already reach parentRoleId, then adding parent -> child would create a cycle.
        if (isReachable(childRoleId, parentRoleId, new HashSet<>())) {
            throw new CyclicHierarchyException("Adding this link would create a circular inheritance hierarchy.");
        }

        RoleHierarchyId id = new RoleHierarchyId(parentRoleId, childRoleId);
        if (hierarchyRepository.existsById(id)) {
            return; // Link already exists
        }

        RoleHierarchy link = RoleHierarchy.builder()
                .id(id)
                .parentRole(parent)
                .childRole(child)
                .build();

        hierarchyRepository.save(link);
    }

    @Transactional
    public void removeHierarchyLink(UUID parentRoleId, UUID childRoleId) {
        RoleHierarchyId id = new RoleHierarchyId(parentRoleId, childRoleId);
        RoleHierarchy link = hierarchyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hierarchy link not found between parent " + parentRoleId + " and child " + childRoleId));
        hierarchyRepository.delete(link);
    }

    /**
     * Resolves the transitive closure of roles (the role itself plus all its child roles recursively).
     */
    public Set<Role> getRoleClosure(Set<Role> roles) {
        Set<Role> closure = new HashSet<>();
        for (Role role : roles) {
            resolveClosureRecursive(role, closure);
        }
        return closure;
    }

    private void resolveClosureRecursive(Role currentRole, Set<Role> closure) {
        if (closure.contains(currentRole)) {
            return;
        }
        closure.add(currentRole);
        List<UUID> childIds = hierarchyRepository.findChildRoleIdsByParentRoleId(currentRole.getId());
        for (UUID childId : childIds) {
            roleRepository.findById(childId).ifPresent(childRole -> resolveClosureRecursive(childRole, closure));
        }
    }

    private boolean isReachable(UUID start, UUID target, Set<UUID> visited) {
        if (start.equals(target)) {
            return true;
        }
        visited.add(start);
        List<UUID> children = hierarchyRepository.findChildRoleIdsByParentRoleId(start);
        for (UUID childId : children) {
            if (!visited.contains(childId)) {
                if (isReachable(childId, target, visited)) {
                    return true;
                }
            }
        }
        return false;
    }
}

