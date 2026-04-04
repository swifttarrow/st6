package com.wct.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {

    private final Claims claims = new Claims();

    public Claims getClaims() {
        return claims;
    }

    public static class Claims {
        private String userId = "sub";
        private String role = "role";
        private String teamId = "team_id";
        private String managerId = "manager_id";
        private String directReports = "direct_reports";

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getTeamId() {
            return teamId;
        }

        public void setTeamId(String teamId) {
            this.teamId = teamId;
        }

        public String getManagerId() {
            return managerId;
        }

        public void setManagerId(String managerId) {
            this.managerId = managerId;
        }

        public String getDirectReports() {
            return directReports;
        }

        public void setDirectReports(String directReports) {
            this.directReports = directReports;
        }
    }
}
