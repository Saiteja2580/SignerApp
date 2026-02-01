package com.signer.signer_api.controllers;

import com.signer.signer_api.models.dto.auth.LoginRequest;
import com.signer.signer_api.models.dto.auth.RegisterResponse;
import com.signer.signer_api.models.dto.auth.UserRegisterRequest;
import com.signer.signer_api.services.AuthService;
import com.signer.signer_api.services.UserDetailsService;
import com.signer.signer_api.utils.ResponseWrapperUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@Slf4j
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ResponseWrapperUtil<RegisterResponse>> registerUser(@RequestBody UserRegisterRequest userData) throws Exception {
        log.info("Register Api is Called");
        UUID userId = userDetailsService.registerUser(userData);
        RegisterResponse user = new RegisterResponse(userId);
        return new ResponseEntity<>(ResponseWrapperUtil.success(user,"User Registered Successfully"),HttpStatus.OK);
    }

    @PostMapping("/login")
    public ResponseEntity<ResponseWrapperUtil<String>> loginUser(@RequestBody LoginRequest userData){
        log.info("Login Api is Called");
        String jwt = authService.authenticateAndGenerateToken(userData);
        ResponseCookie jwtCookie = authService.createJwtCookie(jwt);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString()) // This "saves" the session in the browser
                .body(ResponseWrapperUtil.success(userData.username(), "User Loggedin Successfully"));
    }

    @GetMapping("/verify")
    public ResponseEntity<ResponseWrapperUtil<String>> verifyUser(Authentication authentication) {
        log.info("Verify Api is Called");
        String username = authentication.getName();
        return ResponseEntity.ok(
                ResponseWrapperUtil.success(username, "User is authenticated and token is valid")
        );
    }

    @GetMapping("/logout")
    public ResponseEntity<ResponseWrapperUtil<String>> logoutUser(Authentication authentication){
        log.info("Logout Api is Called");
        
        // Invalidate session certificate
        if (authentication != null) {
            authService.logout(authentication.getName());
        }
        
        ResponseCookie cookie = authService.createLogoutCookie();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ResponseWrapperUtil.success(null, "User Logged out Successfully"));
    }


}
