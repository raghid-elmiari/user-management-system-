package com.rbac.service;

import com.rbac.dto.response.DashboardStatsResponse;
import com.rbac.repository.PermissionRepository;
import com.rbac.repository.RefreshTokenRepository;
import com.rbac.repository.RoleRepository;
import com.rbac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "dashboard", key = "'stats'")
    public DashboardStatsResponse getStats() {
        return DashboardStatsResponse.builder()
                .totalUsers(userRepository.count())
                .activeRoles(roleRepository.count())
                .totalPermissions(permissionRepository.count())
                .activeSessions(refreshTokenRepository.countByRevokedFalseAndExpiresAtAfter(OffsetDateTime.now()))
                .build();
    }
}