package com.signer.signer_api.models.dto.signature;

/**
 * Internal DTO for signature properties used during signing.
 */
public record SigningProperties(
        String fullName,
        String role,
        String location,
        String reason
) {
}
