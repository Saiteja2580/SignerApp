package com.signer.signer_api.models.dto.certificate;

import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.time.Instant;

/**
 * Holds the temporary certificate session data for a logged-in user.
 * This includes the user's private key, certificate, and the certificate chain.
 */
public record CertificateSession(
    PrivateKey privateKey,
    X509Certificate userCertificate,
    X509Certificate[] certificateChain,
    Instant createdAt,
    Instant expiresAt
) {
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}
