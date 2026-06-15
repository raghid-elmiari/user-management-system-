package com.rbac.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class IpRestrictionFilter extends OncePerRequestFilter {

    private final Set<String> whitelist;
    private final Set<String> blacklist;
    private final boolean trustAllProxies;
    private final Set<String> trustedProxies;

    public IpRestrictionFilter(
            @Value("${app.security.ip.whitelist:}") String whitelistStr,
            @Value("${app.security.ip.blacklist:}") String blacklistStr,
            @Value("${app.security.ip.trust-all-proxies:false}") boolean trustAllProxies,
            @Value("${app.security.ip.trusted-proxies:127.0.0.1,0:0:0:0:0:0:0:1}") String trustedProxiesStr
    ) {
        this.whitelist = parseIpSet(whitelistStr);
        this.blacklist = parseIpSet(blacklistStr);
        this.trustAllProxies = trustAllProxies;
        this.trustedProxies = parseIpSet(trustedProxiesStr);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String clientIp = resolveClientIp(request);

        // Blacklist check
        if (!blacklist.isEmpty() && blacklist.contains(clientIp)) {
            logger.warn("Access blocked for blacklisted IP: " + clientIp);
            sendForbiddenResponse(response, "Access denied. Your IP address is blacklisted.");
            return;
        }

        // Whitelist check
        if (!whitelist.isEmpty() && !whitelist.contains(clientIp)) {
            logger.warn("Access blocked for IP not in whitelist: " + clientIp);
            sendForbiddenResponse(response, "Access denied. Your IP address is not whitelisted.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        String remoteAddr = request.getRemoteAddr();

        if (StringUtils.hasText(xForwardedFor)) {
            // Check if request remote address is trusted or if all proxies are trusted
            if (trustAllProxies || trustedProxies.contains(remoteAddr)) {
                // Return client IP (the first one in the comma-separated chain)
                String[] ips = xForwardedFor.split(",");
                if (ips.length > 0 && StringUtils.hasText(ips[0])) {
                    return ips[0].trim();
                }
            }
        }

        return remoteAddr;
    }

    private Set<String> parseIpSet(String ipStr) {
        if (!StringUtils.hasText(ipStr)) {
            return Collections.emptySet();
        }
        return Arrays.stream(ipStr.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());
    }

    private void sendForbiddenResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write(String.format("{\"error\": \"Forbidden\", \"message\": \"%s\"}", message));
    }
}
