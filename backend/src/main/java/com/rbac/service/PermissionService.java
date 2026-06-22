package com.rbac.service;

import com.rbac.domain.Permission;
import com.rbac.dto.request.CreatePermissionRequest;
import com.rbac.dto.response.PermissionResponse;
import com.rbac.exception.DuplicateResourceException;
import com.rbac.mapper.PermissionMapper;
import com.rbac.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.annotation.Transactional;
import com.rbac.exception.ResourceNotFoundException;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final PermissionMapper permissionMapper;

    @Transactional(readOnly = true)
    @Cacheable(value = "permissions", key = "'list'")
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(permissionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = {"permissions","dashboard"}, allEntries = true)
    public PermissionResponse createPermission(CreatePermissionRequest request) {
        if (permissionRepository.findByName(request.getName()).isPresent()) {
            throw new DuplicateResourceException("Permission already exists with name " + request.getName());
        }

        Permission permission = Permission.builder()
                .name(request.getName())
                .resource(request.getResource())
                .action(request.getAction())
                .description(request.getDescription())
                .build();

        Permission saved = permissionRepository.save(permission);
        return permissionMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = {"permissions","dashboard"}, allEntries = true)
    public void deletePermission(UUID id) {
    Permission permission = permissionRepository.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Permission not found"));

    permissionRepository.delete(permission);
}

@Transactional
@CacheEvict(value = {"permissions","dashboard"}, allEntries = true)
public PermissionResponse updatePermission(UUID id, CreatePermissionRequest request) {
    // evict permission lists and dashboard aggregates
    // (annotation applied to method signature)

    Permission permission = permissionRepository.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Permission not found"));

    // Optional: prevent duplicate permission names
    permissionRepository.findByName(request.getName())
            .filter(p -> !p.getId().equals(id))
            .ifPresent(p -> {
                throw new DuplicateResourceException(
                        "Permission already exists with name " + request.getName());
            });

    permission.setName(request.getName());
    permission.setResource(request.getResource());
    permission.setAction(request.getAction());
    permission.setDescription(request.getDescription());

    Permission updated = permissionRepository.save(permission);
    return permissionMapper.toResponse(updated);
}
}

