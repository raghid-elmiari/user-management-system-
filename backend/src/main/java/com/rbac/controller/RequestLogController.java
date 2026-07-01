package com.rbac.controller;

import com.rbac.dto.response.RequestLogResponse;
import com.rbac.service.RequestLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/request-logs")
@RequiredArgsConstructor
public class RequestLogController {

    private final RequestLogService requestLogService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERMISSION_request-log:read')")
    public ResponseEntity<Page<RequestLogResponse>> getRequestLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(requestLogService.getRequestLogs(page, size));
    }
}