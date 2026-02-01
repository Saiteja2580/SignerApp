package com.signer.signer_api.controllers;

import com.signer.signer_api.models.SignedDocument;
import com.signer.signer_api.models.User;
import com.signer.signer_api.models.dto.document.SignedDocumentDto;
import com.signer.signer_api.repo.SignedDocumentRepo;
import com.signer.signer_api.repo.UserRepo;
import com.signer.signer_api.services.storage.DocumentStorageService;
import com.signer.signer_api.models.dto.common.PageResponseDto;
import com.signer.signer_api.utils.ResponseWrapperUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for signed document operations.
 * Provides endpoints for listing, downloading, and deleting signed documents.
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final SignedDocumentRepo signedDocumentRepo;
    private final DocumentStorageService storageService;
    private final UserRepo userRepo;

    @GetMapping
    public ResponseEntity<ResponseWrapperUtil<PageResponseDto<SignedDocumentDto>>> listDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        
        UUID userId = getUserId(authentication);
        log.info("Listing documents for user: {} (page: {}, size: {}, search: {})", userId, page, size, search);

        Pageable pageable = PageRequest.of(page, size, Sort.by("signedAt").descending());
        Page<SignedDocument> documentPage;

        if (search != null && !search.trim().isEmpty()) {
            documentPage = signedDocumentRepo.findByUserIdAndOriginalFileNameContainingIgnoreCase(userId, search.trim(), pageable);
        } else {
            documentPage = signedDocumentRepo.findByUserId(userId, pageable);
        }

        List<SignedDocumentDto> dtos = documentPage.getContent().stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        PageResponseDto<SignedDocumentDto> response = new PageResponseDto<>(
                dtos,
                documentPage.getTotalElements(),
                documentPage.getTotalPages(),
                documentPage.getNumber(),
                documentPage.getSize(),
                documentPage.getNumberOfElements()
        );

        return ResponseEntity.ok(
                ResponseWrapperUtil.success(response, "Documents retrieved successfully")
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseWrapperUtil<SignedDocumentDto>> getDocument(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        SignedDocument document = signedDocumentRepo.findByIdAndUserId(id, userId);

        if (document == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseWrapperUtil.error("Document not found"));
        }

        return ResponseEntity.ok(
                ResponseWrapperUtil.success(toDto(document), "Document retrieved successfully")
        );
    }


    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadDocument(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        SignedDocument document = signedDocumentRepo.findByIdAndUserId(id, userId);

        if (document == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseWrapperUtil.error("Document not found"));
        }

        Optional<byte[]> content = storageService.retrieve(id, userId);
        if (content.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseWrapperUtil.error("Document file not found"));
        }

        String filename = document.getOriginalFileName().replace(".pdf", "_signed.pdf");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(content.get().length);

        log.info("Downloading document {} for user {}", id, userId);
        return new ResponseEntity<>(content.get(), headers, HttpStatus.OK);
    }


    @GetMapping("/{id}/preview")
    public ResponseEntity<?> previewDocument(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        SignedDocument document = signedDocumentRepo.findByIdAndUserId(id, userId);

        if (document == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseWrapperUtil.error("Document not found"));
        }

        Optional<byte[]> content = storageService.retrieve(id, userId);
        if (content.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseWrapperUtil.error("Document file not found"));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline().filename(document.getOriginalFileName()).build());

        log.info("Previewing document {} for user {}", id, userId);
        return new ResponseEntity<>(content.get(), headers, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseWrapperUtil<String>> deleteDocument(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        SignedDocument document = signedDocumentRepo.findByIdAndUserId(id, userId);

        if (document == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseWrapperUtil.error("Document not found"));
        }

        // Delete from storage
        storageService.delete(id, userId);
        
        // Delete from database
        signedDocumentRepo.delete(document);

        log.info("Deleted document {} for user {}", id, userId);
        return ResponseEntity.ok(
                ResponseWrapperUtil.success(null, "Document deleted successfully")
        );
    }


    @GetMapping("/count")
    public ResponseEntity<ResponseWrapperUtil<Long>> getDocumentCount(Authentication authentication) {
        UUID userId = getUserId(authentication);
        long count = signedDocumentRepo.countByUserId(userId);
        return ResponseEntity.ok(
                ResponseWrapperUtil.success(count, "Document count retrieved")
        );
    }

    private UUID getUserId(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    private SignedDocumentDto toDto(SignedDocument document) {
        String baseUrl = "/api/documents/" + document.getId();
        return new SignedDocumentDto(
                document.getId(),
                document.getOriginalFileName(),
                document.getPageNumber(),
                document.getSignerRole(),
                document.getSignerLocation(),
                document.getSignerReason(),
                document.getFileSizeBytes(),
                document.getSignedAt(),
                baseUrl + "/download",
                baseUrl + "/preview"
        );
    }
}
