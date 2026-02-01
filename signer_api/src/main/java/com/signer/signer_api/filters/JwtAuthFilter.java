
package com.signer.signer_api.filters;

import com.signer.signer_api.services.UserDetailsService;
import com.signer.signer_api.utils.JWTUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    // Public endpoints that don't require JWT validation
    private static final String[] PUBLIC_URLS = {
            "/api/user/register",
            "/api/user/login"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String requestPath = request.getRequestURI();

        // Skip JWT validation for public endpoints
        if (isPublicUrl(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = getToken(request);
            if (token != null && jwtUtils.validateToken(token)) {
                String username = jwtUtils.getUsernameFromJWT(token);
                try {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } catch (UsernameNotFoundException e) {
                    log.warn("User not found for token username: {}", username);
                    SecurityContextHolder.clearContext();
                }
            }
        } catch (Exception e) {
            log.error("Authentication filter error: ", e);
            SecurityContextHolder.clearContext();
        }
        filterChain.doFilter(request, response);
    }

    private boolean isPublicUrl(String requestPath) {
        for (String publicUrl : PUBLIC_URLS) {
            if (requestPath.equals(publicUrl)) {
                return true;
            }
        }
        return false;
    }

    private String getToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals("auth_token")) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}