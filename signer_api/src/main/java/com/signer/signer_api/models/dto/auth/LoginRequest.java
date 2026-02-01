package com.signer.signer_api.models.dto.auth;

public record LoginRequest(
        String username,
        String password
) {
}
