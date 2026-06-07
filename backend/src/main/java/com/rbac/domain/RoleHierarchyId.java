package com.rbac.domain;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class RoleHierarchyId implements Serializable {

    @Column(name = "parent_role_id")
    private UUID parentRoleId;

    @Column(name = "child_role_id")
    private UUID childRoleId;
}

