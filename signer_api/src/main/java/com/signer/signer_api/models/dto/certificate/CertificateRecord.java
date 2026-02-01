package com.signer.signer_api.models.dto.certificate;

/**
 * Legacy record for certificate file information.
 * Kept for backward compatibility - session certificates are now used instead.
 */
public record CertificateRecord(
        String certificate_path,
        String certificate_alias
) {
}
