package com.signer.signer_api.models.dto.auth;

import java.util.UUID;

public record JwtTokenGenerationRequest(
        UUID userId,
        String username
) {
}
