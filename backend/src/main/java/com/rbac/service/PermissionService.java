package com.rbac.service;

import com.rbac.domain.Permission;
import com.rbac.dto.request.CreatePermissionRequest;
import com.rbac.dto.response.PermissionResponse;
import com.rbac.exception.DuplicateResourceException;
import com.rbac.mapper.PermissionMapper;
import com.rbac.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final PermissionMapper permissionMapper;

    @Transactional(readOnly = true)
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(permissionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
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
}

