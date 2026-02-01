package com.signer.signer_api.services;

import com.signer.signer_api.models.User;
import com.signer.signer_api.models.dto.auth.LoginRequest;
import com.signer.signer_api.repo.UserRepo;
import com.signer.signer_api.utils.JWTUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JWTUtils jwtUtils;
    private final SessionCertificateService sessionCertificateService;
    private final UserRepo userRepo;

    public String authenticateAndGenerateToken(LoginRequest userData) {
        log.info("Authenticating user: {}", userData.username());

        // 1. Authenticate the user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(userData.username(), userData.password())
        );

        String username = authentication.getName();

        // 2. Get user's full name for certificate
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 3. Create temporary session certificate
        sessionCertificateService.createSession(username, user.getFullname());
        log.info("Session certificate created for user: {}", username);

        // 4. Generate the JWT
        return jwtUtils.generateToken(username);
    }

    public void logout(String username) {
        sessionCertificateService.invalidateSession(username);
        log.info("User logged out and certificate session invalidated: {}", username);
    }

    public ResponseCookie createJwtCookie(String jwt) {
        return ResponseCookie.from("auth_token", jwt)
                .path("/")
                .maxAge(24 * 60 * 60) // 24 hours
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .sameSite("Lax")
                .build();
    }

    public ResponseCookie createLogoutCookie() {
        return ResponseCookie.from("auth_token", "")
                .path("/")
                .maxAge(0) // Expire immediately
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .build();
    }
}