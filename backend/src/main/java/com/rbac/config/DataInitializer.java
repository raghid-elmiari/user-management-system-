package com.rbac.config;

import com.rbac.domain.*;
import com.rbac.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            System.out.println("Initializing default roles, permissions, and users...");

            // Create permissions
            // Create permissions
Permission userRead = createPermissionIfAbsent("user:read", "user", "read", "Read user details");
Permission userWrite = createPermissionIfAbsent("user:write", "user", "write", "Create/Update user details");
Permission userDelete = createPermissionIfAbsent("user:delete", "user", "delete", "Delete users");

Permission roleRead = createPermissionIfAbsent("role:read", "role", "read", "Read roles");
Permission roleWrite = createPermissionIfAbsent("role:write", "role", "write", "Create/Update roles");

Permission permRead = createPermissionIfAbsent("permission:read", "permission", "read", "Read permissions");
Permission permWrite = createPermissionIfAbsent("permission:write", "permission", "write", "Create permissions");

Permission hierarchyRead = createPermissionIfAbsent("hierarchy:read", "hierarchy", "read", "Read role hierarchy");
Permission roleDelete = createPermissionIfAbsent("role:delete", "role", "delete", "Delete roles");

            Permission permDelete = createPermissionIfAbsent("permission:delete", "permission", "delete", "Delete permissions");


            // Create roles
            Role adminRole = createRoleIfAbsent("ROLE_ADMIN", "Administrator with full access");
            Role managerRole = createRoleIfAbsent("ROLE_MANAGER", "Manager with user management capabilities");
            Role userRole = createRoleIfAbsent("ROLE_USER", "Regular user with basic access");
            

            // Assign permissions to roles
            assignPermissionToRole(adminRole, userRead);
            assignPermissionToRole(adminRole, userWrite);
            assignPermissionToRole(adminRole, userDelete);
            assignPermissionToRole(adminRole, roleRead);
            assignPermissionToRole(adminRole, roleWrite);
            assignPermissionToRole(adminRole, permRead);
            assignPermissionToRole(adminRole, permWrite);
            assignPermissionToRole(adminRole, hierarchyRead);
            assignPermissionToRole(adminRole, roleDelete);
            assignPermissionToRole(adminRole, permDelete);

            assignPermissionToRole(managerRole, userRead);
            assignPermissionToRole(managerRole, userWrite);
            assignPermissionToRole(managerRole, roleRead);
             assignPermissionToRole(managerRole, hierarchyRead);
            assignPermissionToRole(userRole, userRead);
            


            // Build the role tree: ROLE_ADMIN is the root, ROLE_MANAGER is its child,
            // ROLE_USER is MANAGER's child. A role inherits permissions from every
            // descendant, so admin ends up with manager's and user's permissions too.
            managerRole.setParentRole(adminRole);
            roleRepository.save(managerRole);
            userRole.setParentRole(managerRole);
            roleRepository.save(userRole);


            // Admin user
            User admin = User.builder()
                    .email("admin@example.com")
                    .username("admin")
                    .name("Super Administrator")
                    .password(passwordEncoder.encode("admin123"))
                    .active(true)
                    .emailVerified(true)
                    .build();
            userRepository.save(admin);
            assignRoleToUser(admin, adminRole);

            // Manager user
            User manager = User.builder()
                    .email("manager@example.com")
                    .username("manager")
                    .name("General Manager")
                    .password(passwordEncoder.encode("manager123"))
                    .active(true)
                    .emailVerified(true)
                    .build();
            userRepository.save(manager);
            assignRoleToUser(manager, managerRole);

            // User user
            User user = User.builder()
                    .email("user@example.com")
                    .username("user")
                    .name("Standard User")
                    .password(passwordEncoder.encode("user123"))
                    .active(true)
                    .emailVerified(true)
                    .build();
            userRepository.save(user);
            assignRoleToUser(user, userRole);

            System.out.println("Default users initialized successfully!");
        }
    }

    private Permission createPermissionIfAbsent(String name, String resource, String action, String description) {
        return permissionRepository.findByName(name)
                .orElseGet(() -> permissionRepository.save(Permission.builder()
                        .name(name)
                        .resource(resource)
                        .action(action)
                        .description(description)
                        .build()));
    }

    private Role createRoleIfAbsent(String name, String description) {
        return roleRepository.findByName(name)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(name)
                        .description(description)
                        .build()));
    }

    private void assignPermissionToRole(Role role, Permission permission) {
        RolePermissionId id = new RolePermissionId(role.getId(), permission.getId());
        if (!rolePermissionRepository.existsById(id)) {
            rolePermissionRepository.save(RolePermission.builder()
                    .id(id)
                    .role(role)
                    .permission(permission)
                    .build());
        }
    }

    private void assignRoleToUser(User user, Role role) {
        UserRoleId id = new UserRoleId(user.getId(), role.getId());
        if (!userRoleRepository.existsById(id)) {
            userRoleRepository.save(UserRole.builder()
                    .id(id)
                    .user(user)
                    .role(role)
                    .assignedAt(OffsetDateTime.now())
                    .build());
        }
    }
}