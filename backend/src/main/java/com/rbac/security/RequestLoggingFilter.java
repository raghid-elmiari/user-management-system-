package com.rbac.security;

import com.rbac.domain.RequestLog;
import com.rbac.service.RequestLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class RequestLoggingFilter extends OncePerRequestFilter {

    private final RequestLogService requestLogService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            String username = null;
            if (authentication != null && authentication.isAuthenticated()) {
                username = authentication.getName();
            }

            RequestLog log = RequestLog.builder()
                    .method(request.getMethod())
                    .endpoint(request.getRequestURI())
                    .status(response.getStatus())
                    .username(username)
                    .ipAddress(request.getRemoteAddr())
                    .durationMs(duration)
                    .build();

            requestLogService.save(log);
        }
    }
}