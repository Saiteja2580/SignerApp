package com.signer.signer_api.models.dto.document;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning signed document metadata in API responses.
 */
public record SignedDocumentDto(
    UUID id,
    String originalFileName,
    int pageNumber,
    String signerRole,
    String signerLocation,
    String signerReason,
    long fileSizeBytes,
    LocalDateTime signedAt,
    String downloadUrl,
    String previewUrl
) {}
