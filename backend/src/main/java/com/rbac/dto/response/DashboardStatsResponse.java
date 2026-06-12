package com.rbac.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalUsers;
    private long activeRoles;
    private long totalPermissions;
    private long activeSessions;
}