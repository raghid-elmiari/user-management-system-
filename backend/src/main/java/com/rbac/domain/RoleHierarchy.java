package com.rbac.domain;

import javax.persistence.*;
import lombok.*;

@Entity
@Table(name = "role_hierarchy")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleHierarchy {

    @EmbeddedId
    private RoleHierarchyId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("parentRoleId")
    @JoinColumn(name = "parent_role_id", columnDefinition = "BINARY(16)")
    private Role parentRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("childRoleId")
    @JoinColumn(name = "child_role_id", columnDefinition = "BINARY(16)")
    private Role childRole;
}

