package com.rbac.service;

import com.rbac.domain.Role;
import com.rbac.domain.User;
import com.rbac.domain.UserRole;
import com.rbac.domain.UserRoleId;
import com.rbac.dto.request.AssignRoleRequest;
import com.rbac.dto.request.CreateUserRequest;
import com.rbac.dto.request.UpdateUserRequest;
import com.rbac.dto.response.UserResponse;
import com.rbac.exception.DuplicateResourceException;
import com.rbac.exception.ResourceNotFoundException;
import com.rbac.mapper.UserMapper;
import com.rbac.repository.RoleRepository;
import com.rbac.repository.UserRepository;
import com.rbac.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
    }

   @Transactional
public UserResponse createUser(CreateUserRequest request) {
    if (userRepository.findByEmail(request.getEmail()).isPresent()) {
        throw new DuplicateResourceException("User already exists with email: " + request.getEmail());
    }
    
    User user = User.builder()
            .email(request.getEmail())
            .username(request.getUsername())
            .name(request.getUsername()) // Default name to username
            .password(passwordEncoder.encode(request.getPassword()))
            .active(true)
            .emailVerified(true)  // ← CHANGED TO TRUE
            .emailVerificationToken(null)  // ← CHANGED TO NULL
            .build();

    User saved = userRepository.save(user);

    // Assign default USER role
    roleRepository.findByName("ROLE_USER").ifPresent(role -> {
        UserRoleId userRoleId = new UserRoleId(saved.getId(), role.getId());
        UserRole userRole = UserRole.builder()
                .id(userRoleId)
                .user(saved)
                .role(role)
                .assignedAt(java.time.OffsetDateTime.now())
                .build();
        userRoleRepository.save(userRole);
        saved.getUserRoles().add(userRole);
    });

    // Optional: Remove or comment out this mock email print since email is auto-verified
    // System.out.println("==================================================");
    // System.out.println("MOCK EMAIL VERIFICATION SENT TO: " + saved.getEmail());
    // System.out.println("Verification Token: " + saved.getEmailVerificationToken());
    // System.out.println("Verification URL: http://localhost:3000/verify-email?token=" + saved.getEmailVerificationToken());
    // System.out.println("==================================================");

    return userMapper.toResponse(saved);
}
    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        // Check unique constraints
        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            if (!existing.getId().equals(userId)) {
                throw new DuplicateResourceException("Email is already taken: " + request.getEmail());
            }
        });

        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());

        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse assignRole(UUID userId, AssignRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + request.getRoleId()));

        UserRoleId userRoleId = new UserRoleId(userId, role.getId());
        if (!userRoleRepository.existsById(userRoleId)) {
            UserRole userRole = UserRole.builder()
                    .id(userRoleId)
                    .user(user)
                    .role(role)
                    .assignedAt(java.time.OffsetDateTime.now())
                    .build();
            userRoleRepository.save(userRole);
            user.getUserRoles().add(userRole);
        }

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse removeRole(UUID userId, UUID roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + roleId));

        UserRoleId userRoleId = new UserRoleId(userId, roleId);
        userRoleRepository.findById(userRoleId).ifPresent(userRole -> {
            userRoleRepository.delete(userRole);
            user.getUserRoles().remove(userRole);
        });

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateStatus(UUID userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        user.setActive(active);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        userRepository.deleteById(userId);
    }
}

