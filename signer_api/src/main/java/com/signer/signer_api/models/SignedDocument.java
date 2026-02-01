package com.signer.signer_api.models;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.domain.Persistable;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity to store metadata about signed PDF documents.
 * The actual PDF content is stored via DocumentStorageService.
 * 
 * Implements Persistable to avoid "Optimistic Locking" errors when using manual ID assignment.
 */
@Entity(name = "signed_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignedDocument implements Persistable<UUID> {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private String storagePath;

    @Column(nullable = false)
    private int pageNumber;

    private String signerRole;
    private String signerLocation;
    private String signerReason;

    @Column(nullable = false)
    private long fileSizeBytes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime signedAt;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PrePersist
    @PostLoad
    protected void markNotNew() {
        this.isNew = false;
        if (this.signedAt == null) {
            this.signedAt = LocalDateTime.now();
        }
    }
}
