package com.signer.signer_api.services.storage;

import java.util.Optional;
import java.util.UUID;

/**
 * Interface for document storage operations.
 * Implementations can use local filesystem, S3, or other storage backends.
 * This abstraction allows easy migration between storage backends.
 */
public interface DocumentStorageService {

    /**
     * Stores a signed PDF document.
     *
     * @param documentId Unique identifier for the document
     * @param userId     The user who owns this document
     * @param content    The PDF content as bytes
     * @param fileName   Original filename
     * @return The storage path/key where the document was stored
     * @throws StorageException if storage fails
     */
    String store(UUID documentId, UUID userId, byte[] content, String fileName) throws StorageException;

    /**
     * Retrieves a document content.
     *
     * @param documentId The document ID
     * @param userId     The user who owns the document
     * @return The document content as bytes, or empty if not found
     */
    Optional<byte[]> retrieve(UUID documentId, UUID userId);

    /**
     * Deletes a document.
     *
     * @param documentId The document ID
     * @param userId     The user who owns the document
     * @return true if deleted, false if not found
     */
    boolean delete(UUID documentId, UUID userId);

    /**
     * Checks if a document exists.
     *
     * @param documentId The document ID
     * @param userId     The user who owns the document
     * @return true if exists
     */
    boolean exists(UUID documentId, UUID userId);

    /**
     * Gets the storage path/URL for a document.
     *
     * @param documentId The document ID
     * @param userId     The user who owns the document
     * @return The storage path or empty if not found
     */
    Optional<String> getStoragePath(UUID documentId, UUID userId);
}
