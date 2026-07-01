package com.rbac.repository;

import com.rbac.domain.RequestLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RequestLogRepository extends JpaRepository<RequestLog, UUID> {
}