package com.signer.signer_api.services;

import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.io.source.ByteArrayOutputStream;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.StampingProperties;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.xobject.PdfFormXObject;
import com.itextpdf.signatures.*;
import com.signer.signer_api.models.SignedDocument;
import com.signer.signer_api.models.User;
import com.signer.signer_api.models.dto.certificate.CertificateSession;
import com.signer.signer_api.models.dto.signature.SignatureRequestDto;
import com.signer.signer_api.models.dto.signature.SigningProperties;
import com.signer.signer_api.repo.SignedDocumentRepo;
import com.signer.signer_api.repo.UserRepo;
import com.signer.signer_api.services.storage.DocumentStorageService;
import com.signer.signer_api.services.storage.LocalFileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SignatureService {

    @Autowired
    private  UserRepo userRepo;
    @Autowired
    private  SessionCertificateService sessionCertificateService;
    @Autowired
    private DocumentStorageService storageService;
    @Autowired
    private  SignedDocumentRepo signedDocumentRepo;

    public byte[] processPdf(SignatureRequestDto signatureRequestDto) throws Exception {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Processing PDF signature for user: {}", username);

        // Get user info
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get session certificate
        CertificateSession session = sessionCertificateService.getSession(username);
        if (session == null) {
            throw new RuntimeException("No valid certificate session found. Please login again.");
        }

        String pdfBase64 = signatureRequestDto.base64Pdf();
        if (pdfBase64.contains(",")) {
            pdfBase64 = pdfBase64.split(",")[1];
        }
        byte[] inputBytes = Base64.getDecoder().decode(pdfBase64);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfReader reader = new PdfReader(new ByteArrayInputStream(inputBytes));
        PdfSigner signer = new PdfSigner(reader, outputStream, new StampingProperties());

        SigningProperties signingProperties = new SigningProperties(
                user.getFullname(),
                signatureRequestDto.role(),
                signatureRequestDto.location(),
                signatureRequestDto.reason()
        );

        createSignatureBox(signer, signatureRequestDto, signingProperties);
        applyDigitalSignature(signer, session);

        byte[] signedPdf = outputStream.toByteArray();
        
        // Save signed document to storage and database
        saveSignedDocument(user.getId(), signedPdf, signatureRequestDto);

        log.info("PDF signed and saved successfully for user: {}", username);
        return signedPdf;
    }


    private void saveSignedDocument(UUID userId, byte[] signedPdf, SignatureRequestDto dto) {
        UUID documentId = UUID.randomUUID();
        
        // Extract original filename or generate one
        String originalFileName = "document.pdf"; // Could be passed in DTO in future
        
        // Store the PDF file
        String storagePath = storageService.store(documentId, userId, signedPdf, originalFileName);
        
        // Save metadata to database
        SignedDocument document = SignedDocument.builder()
                .id(documentId)
                .userId(userId)
                .originalFileName(originalFileName)
                .storagePath(storagePath)
                .pageNumber(dto.pageNumber())
                .signerRole(dto.role())
                .signerLocation(dto.location())
                .signerReason(dto.reason())
                .fileSizeBytes(signedPdf.length)
                .build();
        
        signedDocumentRepo.save(document);
        log.info("Saved signed document {} for user {}", documentId, userId);
    }

    private Color convertHexToColor(String hexColor) {
        if (hexColor == null || hexColor.isEmpty()) return ColorConstants.BLACK;
        String cleanHex = hexColor.replace("#", "");
        int r = Integer.valueOf(cleanHex.substring(0, 2), 16);
        int g = Integer.valueOf(cleanHex.substring(2, 4), 16);
        int b = Integer.valueOf(cleanHex.substring(4, 6), 16);
        return new DeviceRgb(r, g, b);
    }

    private void createSignatureBox(PdfSigner signer, SignatureRequestDto dto, SigningProperties signingProperties) {
        Rectangle rect = new Rectangle(dto.x(), dto.y(), dto.width(), dto.height());
        PdfSignatureAppearance appearance = signer.getSignatureAppearance()
                .setLocation(signingProperties.location())
                .setReason(signingProperties.reason());
        appearance.setPageRect(rect);
        appearance.setPageNumber(dto.pageNumber());

        String formattedText = String.format(
                "Digitally Signed By : %s\nRole : %s\nLocation : %s\nDate : %s",
                signingProperties.fullName(),
                signingProperties.role(),
                signingProperties.location(),
                new java.util.Date()
        );

        appearance.setLayer2Text(formattedText);
        appearance.setLayer2FontSize(dto.fontSize());
        Color fontColor = convertHexToColor(dto.fontColor());
        appearance.setLayer2FontColor(fontColor);

        // If we have a custom signature image (drawn, uploaded, or generated from text)
        if (dto.signatureImage() != null && !dto.signatureImage().isEmpty()) {
            try {
                log.info("Applying custom signature image");
                String imgBase64 = dto.signatureImage();
                if (imgBase64.contains(",")) {
                    imgBase64 = imgBase64.split(",")[1];
                }
                byte[] imageBytes = Base64.getDecoder().decode(imgBase64);
                ImageData imageData = ImageDataFactory.create(imageBytes);
                appearance.setSignatureGraphic(imageData);
                appearance.setRenderingMode(PdfSignatureAppearance.RenderingMode.GRAPHIC_AND_DESCRIPTION);
            } catch (Exception e) {
                log.error("Failed to apply custom signature image, falling back to description only", e);
                appearance.setRenderingMode(PdfSignatureAppearance.RenderingMode.DESCRIPTION);
            }
        } else {
            appearance.setRenderingMode(PdfSignatureAppearance.RenderingMode.DESCRIPTION);
        }

        appearance.setReuseAppearance(false);

        // Clear layer 0 to hide default iText text if needed, or just draw our border
        PdfFormXObject layer0 = appearance.getLayer0();
        PdfCanvas canvas = new PdfCanvas(layer0, signer.getDocument());
        canvas.setStrokeColor(convertHexToColor(dto.borderColor()));
        canvas.setLineWidth(1);
        canvas.rectangle(0, 0, dto.width(), dto.height());
        canvas.stroke();
    }


    private void applyDigitalSignature(PdfSigner signer, CertificateSession session) throws Exception {
        PrivateKey privateKey = session.privateKey();
        X509Certificate[] chain = session.certificateChain();

        // Convert to generic Certificate array for iText
        java.security.cert.Certificate[] certChain = new java.security.cert.Certificate[chain.length];
        System.arraycopy(chain, 0, certChain, 0, chain.length);

        IExternalSignature pks = new PrivateKeySignature(privateKey, DigestAlgorithms.SHA256, "BC");
        IExternalDigest digest = new BouncyCastleDigest();

        // Sign with the certificate chain
        signer.signDetached(digest, pks, certChain, null, null, null, 0, PdfSigner.CryptoStandard.CMS);

        log.info("Digital signature applied with certificate chain (user cert + root CA)");
    }
}
