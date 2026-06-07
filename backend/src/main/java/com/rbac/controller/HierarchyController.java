package com.rbac.controller;

import com.rbac.dto.request.RoleHierarchyRequest;
import com.rbac.service.RoleHierarchyService;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/hierarchy")
@RequiredArgsConstructor
public class HierarchyController {

    private final RoleHierarchyService hierarchyService;

    @PostMapping
    @PreAuthorize("hasAuthority('PERMISSION_role:write')")
    public ResponseEntity<Void> addHierarchy(@Valid @RequestBody RoleHierarchyRequest request) {
        hierarchyService.addHierarchyLink(request.getParentRoleId(), request.getChildRoleId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{parentId}/{childId}")
    @PreAuthorize("hasAuthority('PERMISSION_role:write')")
    public ResponseEntity<Void> removeHierarchy(@PathVariable UUID parentId, @PathVariable UUID childId) {
        hierarchyService.removeHierarchyLink(parentId, childId);
        return ResponseEntity.noContent().build();
    }
}

