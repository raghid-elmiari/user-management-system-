package com.rbac.service;

import com.rbac.domain.Role;
import com.rbac.domain.User;
import com.rbac.domain.UserRole;
import com.rbac.domain.UserRoleId;
import com.rbac.domain.RefreshToken;
import com.rbac.dto.request.LoginRequest;
import com.rbac.dto.request.RegisterRequest;
import com.rbac.dto.request.ResetPasswordRequest;
import com.rbac.dto.response.AuthResponse;
import com.rbac.exception.DuplicateResourceException;
import com.rbac.exception.ResourceNotFoundException;
import com.rbac.repository.RefreshTokenRepository;
import com.rbac.repository.RoleRepository;
import com.rbac.repository.UserRepository;
import com.rbac.repository.UserRoleRepository;
import com.rbac.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final RoleHierarchyService roleHierarchyService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateResourceException("Email is already registered: " + request.getEmail());
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new DuplicateResourceException("Username is already taken: " + request.getUsername());
        }

           User user = User.builder()
            .email(request.getEmail())
            .username(request.getUsername())
            .name(request.getName())
            .password(passwordEncoder.encode(request.getPassword()))
            .active(true)
            .emailVerified(true)  // CHANGE THIS TO TRUE
            .emailVerificationToken(null)  // No token needed
            .build();
            
        User saved = userRepository.save(user);

        // Assign default ROLE_USER
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> {
                    Role role = Role.builder().name("ROLE_USER").description("Default User").build();
                    return roleRepository.save(role);
                });

        UserRoleId userRoleId = new UserRoleId(saved.getId(), userRole.getId());
        UserRole uRole = UserRole.builder()
                .id(userRoleId)
                .user(saved)
                .role(userRole)
                .assignedAt(OffsetDateTime.now())
                .build();
        userRoleRepository.save(uRole);
        saved.getUserRoles().add(uRole);


        return buildAuthResponse(saved);
    }

 @Transactional
public AuthResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.getEmail())
            .or(() -> userRepository.findByUsername(request.getEmail()))
            .orElseThrow(() -> new BadCredentialsException("Invalid email/username or password"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new BadCredentialsException("Invalid email/username or password");
    }

    if (!user.isActive()) {
        throw new DisabledException("Your account has been deactivated. Please contact an administrator.");
    }

    // Email verification check removed for development
    // All users can login immediately after registration

    user.setLastLogin(OffsetDateTime.now());
    userRepository.save(user);

    return buildAuthResponse(user);
}

    @Transactional
    public AuthResponse refreshToken(String tokenStr) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BadCredentialsException("Refresh token has expired or has been revoked");
        }

        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (!user.isActive()) {
            throw new DisabledException("User is deactivated");
        }

        // Resolve roles and permissions
        Set<Role> directRoles = user.getUserRoles().stream()
                .map(UserRole::getRole)
                .collect(Collectors.toSet());
        Set<Role> allRoles = roleHierarchyService.getRoleClosure(directRoles);
        List<String> roleNames = allRoles.stream().map(Role::getName).collect(Collectors.toList());
        List<String> permissions = allRoles.stream()
                .flatMap(role -> role.getRolePermissions().stream())
                .map(rp -> rp.getPermission().getName())
                .distinct()
                .collect(Collectors.toList());

        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), roleNames, permissions);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(tokenStr)
                .email(user.getEmail())
                .username(user.getUsername())
                .roles(roleNames)
                .permissions(permissions)
                .build();
    }

    @Transactional
    public void logout(String tokenStr) {
        refreshTokenRepository.findByToken(tokenStr).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findAll().stream()
                .filter(u -> token.equals(u.getEmailVerificationToken()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired verification token"));

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        userRepository.save(user);
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email " + email));

        user.setPasswordResetToken(UUID.randomUUID().toString());
        user.setPasswordResetTokenExpiresAt(OffsetDateTime.now().plusHours(1));
        userRepository.save(user);

        // Print mock reset link to console
        System.out.println("==================================================");
        System.out.println("MOCK PASSWORD RESET SENT TO: " + user.getEmail());
        System.out.println("Reset Token: " + user.getPasswordResetToken());
        System.out.println("Reset URL: http://localhost:3000/reset-password?token=" + user.getPasswordResetToken());
        System.out.println("==================================================");
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findAll().stream()
                .filter(u -> request.getToken().equals(u.getPasswordResetToken()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired reset token"));

        if (user.getPasswordResetTokenExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BadCredentialsException("Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        Set<Role> directRoles = user.getUserRoles().stream()
                .map(UserRole::getRole)
                .collect(Collectors.toSet());

        Set<Role> allRoles = roleHierarchyService.getRoleClosure(directRoles);

        List<String> roleNames = allRoles.stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        List<String> permissions = allRoles.stream()
                .flatMap(role -> role.getRolePermissions().stream())
                .map(rp -> rp.getPermission().getName())
                .distinct()
                .collect(Collectors.toList());

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), roleNames, permissions);

        // Generate and save Refresh Token
        String refreshTokenStr = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(user.getId())
                .token(refreshTokenStr)
                .expiresAt(OffsetDateTime.now().plusDays(7)) // 7 days expiration
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .email(user.getEmail())
                .username(user.getUsername())
                .roles(roleNames)
                .permissions(permissions)
                .build();
    }
}

