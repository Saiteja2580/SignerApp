package com.signer.signer_api.models.dto.auth;

public record UserRegisterRequest(
        String fullname,
        String username,
        String password
) {
}
