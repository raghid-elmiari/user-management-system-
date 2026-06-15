package com.rbac.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private final int rpm;
    private final int rph;
    private final int rpd;
    private final boolean trustAllProxies;
    private final Set<String> trustedProxies;

    public RateLimitingFilter(
            @Value("${app.security.rate-limit.rpm:60}") int rpm,
            @Value("${app.security.rate-limit.rph:1000}") int rph,
            @Value("${app.security.rate-limit.rpd:10000}") int rpd,
            @Value("${app.security.ip.trust-all-proxies:false}") boolean trustAllProxies,
            @Value("${app.security.ip.trusted-proxies:127.0.0.1,0:0:0:0:0:0:0:1}") String trustedProxiesStr
    ) {
        this.rpm = rpm;
        this.rph = rph;
        this.rpd = rpd;
        this.trustAllProxies = trustAllProxies;
        this.trustedProxies = Arrays.stream(trustedProxiesStr.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Exclude actuator health endpoint from rate limiting to prevent health check failures
        if ("/actuator/health".equals(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = resolveClientIp(request);
        Bucket bucket = cache.computeIfAbsent(ip, this::createNewBucket);

        if (bucket.tryConsume(1)) {
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(bucket.getAvailableTokens()));
            filterChain.doFilter(request, response);
        } else {
            logger.warn("Rate limit exceeded for IP: " + ip);
            sendTooManyRequestsResponse(response, "Too many requests. Please try again later.");
        }
    }

    private Bucket createNewBucket(String ip) {
        Bandwidth limitMin = Bandwidth.classic(rpm, Refill.intervally(rpm, Duration.ofMinutes(1)));
        Bandwidth limitHour = Bandwidth.classic(rph, Refill.intervally(rph, Duration.ofHours(1)));
        Bandwidth limitDay = Bandwidth.classic(rpd, Refill.intervally(rpd, Duration.ofDays(1)));

        return Bucket.builder()
                .addLimit(limitMin)
                .addLimit(limitHour)
                .addLimit(limitDay)
                .build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        String remoteAddr = request.getRemoteAddr();

        if (StringUtils.hasText(xForwardedFor)) {
            if (trustAllProxies || trustedProxies.contains(remoteAddr)) {
                String[] ips = xForwardedFor.split(",");
                if (ips.length > 0 && StringUtils.hasText(ips[0])) {
                    return ips[0].trim();
                }
            }
        }

        return remoteAddr;
    }

    private void sendTooManyRequestsResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429); // HttpStatus.TOO_MANY_REQUESTS
        response.setContentType("application/json");
        response.addHeader("Retry-After", "60");
        response.getWriter().write(String.format("{\"error\": \"Too Many Requests\", \"message\": \"%s\"}", message));
    }
}
