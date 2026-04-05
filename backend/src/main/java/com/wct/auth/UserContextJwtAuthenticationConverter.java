package com.wct.auth;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UserContextJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AuthenticatedUserContextMapper authenticatedUserContextMapper;

    public UserContextJwtAuthenticationConverter(AuthenticatedUserContextMapper authenticatedUserContextMapper) {
        this.authenticatedUserContextMapper = authenticatedUserContextMapper;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UserContext userContext = authenticatedUserContextMapper.fromJwt(jwt);
        return new JwtAuthenticationToken(
                jwt,
                List.of(new SimpleGrantedAuthority("ROLE_" + userContext.role().name())),
                userContext.userId()
        );
    }
}
