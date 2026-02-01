package com.signer.signer_api.models.dto.signature;

/**
 * Request DTO for PDF signing operation.
 */
public record SignatureRequestDto(
         int pageNumber,
         float x,
         float y,
         float width,
         float height,
         String borderColor,
         float fontSize,
         String fontStyle,
         String fontColor,
         String role,
         String reason,
         String location,
         String base64Pdf,
         String signatureImage,
         String signatureText,
         String signatureFont
) {
}
