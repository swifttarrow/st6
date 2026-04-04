package com.wct.demo;

import com.wct.auth.AuthProperties;
import com.wct.auth.Role;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/demo-host")
@ConditionalOnProperty(prefix = "app.demo-host", name = "enabled", havingValue = "true")
public class HostDemoController {

    private static final JwsHeader DEMO_HEADER = JwsHeader.with(MacAlgorithm.HS256).type("JWT").build();

    private final JwtEncoder jwtEncoder;
    private final AuthProperties authProperties;

    public HostDemoController(JwtEncoder jwtEncoder, AuthProperties authProperties) {
        this.jwtEncoder = jwtEncoder;
        this.authProperties = authProperties;
    }

    @GetMapping("/context")
    public DemoHostContextResponse getContext(@RequestParam(defaultValue = "manager") String persona) {
        DemoHostPersona selectedPersona = DemoHostPersona.fromQuery(persona);
        String accessToken = issueAccessToken(selectedPersona);

        return new DemoHostContextResponse(
                selectedPersona.key(),
                selectedPersona.label(),
                selectedPersona.summary(),
                selectedPersona.defaultRoute(),
                accessToken,
                selectedPersona.userId(),
                selectedPersona.role(),
                selectedPersona.teamId(),
                selectedPersona.managerId(),
                selectedPersona.directReportIds()
        );
    }

    private String issueAccessToken(DemoHostPersona persona) {
        AuthProperties.Claims claims = authProperties.getClaims();
        Instant now = Instant.now();

        JwtClaimsSet.Builder builder = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(now.plusSeconds(60L * 60L * 8L))
                .subject(persona.userId())
                .claim(claims.getRole(), persona.role().name())
                .claim(claims.getTeamId(), persona.teamId());

        if (StringUtils.hasText(persona.managerId())) {
            builder.claim(claims.getManagerId(), persona.managerId());
        }
        if (!persona.directReportIds().isEmpty()) {
            builder.claim(claims.getDirectReports(), persona.directReportIds());
        }

        return jwtEncoder.encode(JwtEncoderParameters.from(DEMO_HEADER, builder.build())).getTokenValue();
    }

    private enum DemoHostPersona {
        IC(
                "ic",
                "Alice (IC)",
                "Shows an individual contributor session focused on weekly planning and reconciliation.",
                "/commitments",
                "alice",
                Role.IC,
                "team-alpha",
                "manager-1",
                List.of()
        ),
        MANAGER(
                "manager",
                "Morgan (Manager)",
                "Shows the module mounted for a people manager with direct-report scope provided by the host.",
                "/team",
                "manager-1",
                Role.MANAGER,
                "team-alpha",
                null,
                List.of("alice", "bob", "carol", "diana", "frank")
        ),
        LEADERSHIP(
                "leadership",
                "Lee (Leadership)",
                "Shows the leadership view with organization-level access routed through the same host contract.",
                "/leadership",
                "leader-1",
                Role.LEADERSHIP,
                "exec-team",
                null,
                List.of()
        );

        private final String key;
        private final String label;
        private final String summary;
        private final String defaultRoute;
        private final String userId;
        private final Role role;
        private final String teamId;
        private final String managerId;
        private final List<String> directReportIds;

        DemoHostPersona(String key,
                        String label,
                        String summary,
                        String defaultRoute,
                        String userId,
                        Role role,
                        String teamId,
                        String managerId,
                        List<String> directReportIds) {
            this.key = key;
            this.label = label;
            this.summary = summary;
            this.defaultRoute = defaultRoute;
            this.userId = userId;
            this.role = role;
            this.teamId = teamId;
            this.managerId = managerId;
            this.directReportIds = directReportIds;
        }

        static DemoHostPersona fromQuery(String rawPersona) {
            String normalized = rawPersona == null ? "" : rawPersona.trim().toLowerCase(Locale.US);
            return Arrays.stream(values())
                    .filter(persona -> persona.key.equals(normalized))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Unknown demo host persona: " + rawPersona
                    ));
        }

        String key() {
            return key;
        }

        String label() {
            return label;
        }

        String summary() {
            return summary;
        }

        String defaultRoute() {
            return defaultRoute;
        }

        String userId() {
            return userId;
        }

        Role role() {
            return role;
        }

        String teamId() {
            return teamId;
        }

        String managerId() {
            return managerId;
        }

        List<String> directReportIds() {
            return directReportIds;
        }
    }
}
