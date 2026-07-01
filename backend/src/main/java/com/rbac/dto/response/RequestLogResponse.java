package com.rbac.dto.response;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestLogResponse {

    private UUID id;
    private String method;
    private String endpoint;
    private Integer status;
    private String username;
    private String ipAddress;
    private Long durationMs;
    private OffsetDateTime createdAt;
}