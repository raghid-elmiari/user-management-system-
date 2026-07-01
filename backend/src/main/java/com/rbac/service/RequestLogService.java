package com.rbac.service;

import com.rbac.domain.RequestLog;
import com.rbac.dto.response.RequestLogResponse;
import com.rbac.repository.RequestLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RequestLogService {

    private final RequestLogRepository requestLogRepository;

    public void save(RequestLog requestLog) {
        requestLogRepository.save(requestLog);
    }

    public Page<RequestLogResponse> getRequestLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        return requestLogRepository.findAll(pageable)
                .map(this::toResponse);
    }

    private RequestLogResponse toResponse(RequestLog requestLog) {
        return RequestLogResponse.builder()
                .id(requestLog.getId())
                .method(requestLog.getMethod())
                .endpoint(requestLog.getEndpoint())
                .status(requestLog.getStatus())
                .username(requestLog.getUsername())
                .ipAddress(requestLog.getIpAddress())
                .durationMs(requestLog.getDurationMs())
                .createdAt(requestLog.getCreatedAt())
                .build();
    }
}