package com.signer.signer_api.services;

import com.signer.signer_api.models.CustomUserDetails;
import com.signer.signer_api.models.User;
import com.signer.signer_api.models.dto.auth.UserRegisterRequest;
import com.signer.signer_api.repo.UserRepo;
import com.signer.signer_api.utils.PasswordEncoderUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/**
 * Handles user authentication and registration.
 * Note: Certificates are now generated on login (session-based), not during registration.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserDetailsService implements org.springframework.security.core.userdetails.UserDetailsService {

    private final UserRepo userRepo;
    private final PasswordEncoderUtil passwordEncoderUtil;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return new CustomUserDetails(user);
    }

    /**
     * Registers a new user.
     * Note: No permanent certificate is generated - certificates are now created
     * dynamically on login and stored in-memory for the session duration.
     */
    public UUID registerUser(UserRegisterRequest userData) throws Exception {
        log.info("Register User Method Called for: {}", userData.username());

        // Check if user already exists
        Optional<User> existingUser = userRepo.findByUsername(userData.username());
        if (existingUser.isPresent()) {
            throw new Exception("User Already Exists");
        }

        // Create new user without permanent certificate
        String encodedPassword = passwordEncoderUtil.encode(userData.password());
        User newUser = User.builder()
                .username(userData.username())
                .password(encodedPassword)
                .fullname(userData.fullname())
                // Certificate fields are null - certs created on login now
                .certificate_path(null)
                .certificate_alias(null)
                .build();

        User savedUser = userRepo.save(newUser);
        log.info("User registered successfully: {}", savedUser.getId());

        return savedUser.getId();
    }
}
