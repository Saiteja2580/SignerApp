package com.signer.signer_api.repo;

import com.signer.signer_api.models.SignedDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SignedDocumentRepo extends JpaRepository<SignedDocument, UUID> {
    
    /**
     * Find all documents for a specific user, ordered by sign date descending.
     */
    List<SignedDocument> findByUserIdOrderBySignedAtDesc(UUID userId);

    /**
     * Find documents for a user with pagination.
     */
    Page<SignedDocument> findByUserId(UUID userId, Pageable pageable);

    /**
     * Search documents for a user by filename with pagination.
     */
    Page<SignedDocument> findByUserIdAndOriginalFileNameContainingIgnoreCase(UUID userId, String name, Pageable pageable);
    
    /**
     * Find a specific document by ID and user ID (for security).
     */
    SignedDocument findByIdAndUserId(UUID id, UUID userId);
    
    /**
     * Count documents for a user.
     */
    long countByUserId(UUID userId);
}
