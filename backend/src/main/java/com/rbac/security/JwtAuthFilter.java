package com.rbac.security;

import io.jsonwebtoken.Claims;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String userId = jwtService.extractClaim(token, Claims::getSubject);
            List<String> permissions = jwtService.extractClaim(token, claims -> (List<String>) claims.get("permissions"));
            List<SimpleGrantedAuthority> authorities = permissions.stream()
                    .map(permission -> new SimpleGrantedAuthority("PERMISSION_" + permission))
                    .collect(Collectors.toList());

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
        List<String> permissions = jwtService.extractClaim(token,
    claims -> (List<String>) claims.get("permissions"));
List<String> roles = jwtService.extractClaim(token,
    claims -> (List<String>) claims.get("roles"));  // add roles to JWT in AuthService too

List<SimpleGrantedAuthority> authorities = new ArrayList<>();
if (permissions != null)
    permissions.forEach(p -> authorities.add(new SimpleGrantedAuthority("PERMISSION_" + p)));
if (roles != null)
    roles.forEach(r -> authorities.add(new SimpleGrantedAuthority(r)));
    }
}

