package com.rbac.repository;

import com.rbac.domain.Role;
import com.rbac.domain.User;
import com.rbac.domain.UserRole;
import com.rbac.dto.request.UserFilter;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Join;
import javax.persistence.criteria.JoinType;
import javax.persistence.criteria.Predicate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    public static Specification<User> filterUsers(UserFilter filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Global Search (matches name, username, or email)
            if (filter.getSearch() != null && StringUtils.hasText(filter.getSearch())) {
                String searchPattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern);
                Predicate usernameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("username")), searchPattern);
                Predicate emailLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), searchPattern);
                predicates.add(criteriaBuilder.or(nameLike, usernameLike, emailLike));
            }

            // 2. Specific Column Filters
            if (filter.getName() != null && StringUtils.hasText(filter.getName())) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%" + filter.getName().trim().toLowerCase() + "%"));
            }
            if (filter.getUsername() != null && StringUtils.hasText(filter.getUsername())) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("username")), "%" + filter.getUsername().trim().toLowerCase() + "%"));
            }
            if (filter.getEmail() != null && StringUtils.hasText(filter.getEmail())) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), "%" + filter.getEmail().trim().toLowerCase() + "%"));
            }

            // 3. Status Filter
            if (filter.getActive() != null) {
                predicates.add(criteriaBuilder.equal(root.get("active"), filter.getActive()));
            }

            // 4. Role Filter
            if (filter.getRole() != null && StringUtils.hasText(filter.getRole()) && !"ALL".equalsIgnoreCase(filter.getRole())) {
                Join<User, UserRole> userRolesJoin = root.join("userRoles", JoinType.LEFT);
                Join<UserRole, Role> roleJoin = userRolesJoin.join("role", JoinType.LEFT);
                
                query.distinct(true);
                
                String roleSearch = filter.getRole().trim().toUpperCase();
                if (!roleSearch.startsWith("ROLE_")) {
                    roleSearch = "ROLE_" + roleSearch;
                }
                predicates.add(criteriaBuilder.equal(criteriaBuilder.upper(roleJoin.get("name")), roleSearch));
            }

            // 5. Date Range Filter
            if (filter.getStartDate() != null && StringUtils.hasText(filter.getStartDate())) {
                try {
                    OffsetDateTime start = OffsetDateTime.parse(filter.getStartDate());
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), start));
                } catch (DateTimeParseException e) {
                    // Ignore invalid format
                }
            }
            if (filter.getEndDate() != null && StringUtils.hasText(filter.getEndDate())) {
                try {
                    OffsetDateTime end = OffsetDateTime.parse(filter.getEndDate());
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), end));
                } catch (DateTimeParseException e) {
                    // Ignore invalid format
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
