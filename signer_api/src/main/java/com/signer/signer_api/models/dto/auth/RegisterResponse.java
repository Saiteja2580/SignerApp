package com.signer.signer_api.models.dto.auth;

import java.util.UUID;

public record RegisterResponse(
        UUID userId
) {
}
