package com.rbac.service;

import com.rbac.domain.Role;
import com.rbac.domain.User;
import com.rbac.domain.UserRole;
import com.rbac.domain.UserRoleId;
import com.rbac.dto.request.AssignRoleRequest;
import com.rbac.dto.request.CreateUserRequest;
import com.rbac.dto.request.UpdateUserRequest;
import com.rbac.dto.request.UserFilter;
import com.rbac.dto.response.UserResponse;
import com.rbac.dto.response.PaginatedResponse;
import com.rbac.exception.DuplicateResourceException;
import com.rbac.exception.ResourceNotFoundException;
import com.rbac.mapper.UserMapper;
import com.rbac.repository.RefreshTokenRepository;
import com.rbac.repository.RoleRepository;
import com.rbac.repository.UserRepository;
import com.rbac.repository.UserRoleRepository;
import com.rbac.repository.UserSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class UserService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository     userRepository;
    private final RoleRepository     roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserMapper         userMapper;
    private final PasswordEncoder    passwordEncoder;

    @Transactional(readOnly = true)
    @Cacheable(value = "users", key = "'list'")
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<UserResponse> getUsers(UserFilter filter, Pageable pageable) {
        Specification<User> spec = UserSpecification.filterUsers(filter);
        Page<User> page = userRepository.findAll(spec, pageable);

        List<UserResponse> content = page.getContent().stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<UserResponse>builder()
                .content(content)
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .pageSize(page.getSize())
                .build();
    }

    @Transactional
    @CacheEvict(value = {"users","dashboard"}, allEntries = true)
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateResourceException("User already exists with email: " + request.getEmail());
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new DuplicateResourceException("User already exists with username: " + request.getUsername());
        }

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .name(StringUtils.hasText(request.getName()) ? request.getName() : request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .active(true)
                .emailVerified(true)
                .build();

        User saved = userRepository.save(user);

        String roleName = StringUtils.hasText(request.getRoleName()) ? request.getRoleName() : "ROLE_USER";
        assignRoleByName(saved, roleName);

        return userMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = {"users","dashboard"}, allEntries = true)
    public UserResponse updateProfile(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            if (!existing.getId().equals(userId)) {
                throw new DuplicateResourceException("Email is already taken: " + request.getEmail());
            }
        });

        userRepository.findByUsername(request.getUsername()).ifPresent(existing -> {
            if (!existing.getId().equals(userId)) {
                throw new DuplicateResourceException("Username is already taken: " + request.getUsername());
            }
        });

        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());

        if (StringUtils.hasText(request.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User saved = userRepository.save(user);

        if (StringUtils.hasText(request.getRoleName())) {
        userRoleRepository.deleteAllByUserId(saved.getId());
        saved.getUserRoles().clear();
        assignRoleByName(saved, request.getRoleName());

        // Force re-login
        refreshTokenRepository.revokeAllByUserId(saved.getId());
        }

        return userMapper.toResponse(saved);
    }

  @Transactional
        @CacheEvict(value = {"users","dashboard"}, allEntries = true)
        public UserResponse updateStatus(UUID userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        user.setActive(active);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    @CacheEvict(value = {"users","dashboard"}, allEntries = true)
    public void deleteUser(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        userRepository.deleteById(userId);
    }
    
    @Transactional
    @CacheEvict(value = {"users","roles","dashboard"}, allEntries = true)
    public UserResponse assignRole(UUID userId, AssignRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        Role role = (request.getRoleId() != null)
                ? roleRepository.findById(request.getRoleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + request.getRoleId()))
                : roleRepository.findByName(request.getRoleName())
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRoleName()));

        UserRoleId userRoleId = new UserRoleId(userId, role.getId());
        if (!userRoleRepository.existsById(userRoleId)) {
            UserRole userRole = UserRole.builder()
                    .id(userRoleId)
                    .user(user)
                    .role(role)
                    .assignedAt(OffsetDateTime.now())
                    .build();
            userRoleRepository.save(userRole);
            user.getUserRoles().add(userRole);
        }
        refreshTokenRepository.revokeAllByUserId(userId);
        return userMapper.toResponse(user);
    }

    @Transactional
    @CacheEvict(value = {"users","roles","dashboard"}, allEntries = true)
    public UserResponse removeRole(UUID userId, UUID roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + roleId));

        UserRoleId userRoleId = new UserRoleId(userId, roleId);
        userRoleRepository.findById(userRoleId).ifPresent(userRole -> {
            userRoleRepository.delete(userRole);
            user.getUserRoles().remove(userRole);
        });
        refreshTokenRepository.revokeAllByUserId(userId);
        return userMapper.toResponse(user);
    }

  

    // ── private helper ────────────────────────────────────────────


 private void assignRoleByName(User user, String roleName) {
    Role role = roleRepository.findByName(roleName)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));

    UserRoleId id = new UserRoleId(user.getId(), role.getId());
    if (!userRoleRepository.existsById(id)) {
        UserRole userRole = UserRole.builder()
                .id(id)
                .user(user)
                .role(role)
                .assignedAt(OffsetDateTime.now())
                .build();
        userRoleRepository.saveAndFlush(userRole);
    }
}
}

 
