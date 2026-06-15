package com.rbac.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFilter {
    private String search;
    private String name;
    private String username;
    private String email;
    private Boolean active;
    private String role;
    private String startDate;
    private String endDate;
}
