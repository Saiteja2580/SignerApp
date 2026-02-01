package com.signer.signer_api.services.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;


@Slf4j
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements DocumentStorageService {

    @Value("${app.documents.storage.path:./uploads/signed-documents}")
    private String basePath;

    private Path baseDir;

    @PostConstruct
    public void init() {
        baseDir = Paths.get(basePath);
        try {
            if (!Files.exists(baseDir)) {
                Files.createDirectories(baseDir);
                log.info("Created document storage directory: {}", baseDir.toAbsolutePath());
            }
        } catch (IOException e) {
            throw new StorageException("Failed to create storage directory", e);
        }
    }

    @Override
    public String store(UUID documentId, UUID userId, byte[] content, String fileName) throws StorageException {
        try {
            Path userDir = baseDir.resolve(userId.toString());
            if (!Files.exists(userDir)) {
                Files.createDirectories(userDir);
            }

            Path filePath = userDir.resolve(documentId.toString() + ".pdf");
            Files.write(filePath, content);

            log.info("Stored document {} for user {} at: {}", documentId, userId, filePath.toAbsolutePath());
            return filePath.toAbsolutePath().toString();
        } catch (IOException e) {
            throw new StorageException("Failed to store document: " + documentId, e);
        }
    }

    @Override
    public Optional<byte[]> retrieve(UUID documentId, UUID userId) {
        Path filePath = baseDir.resolve(userId.toString()).resolve(documentId.toString() + ".pdf");
        if (Files.exists(filePath)) {
            try {
                return Optional.of(Files.readAllBytes(filePath));
            } catch (IOException e) {
                log.error("Failed to read document: {}", documentId, e);
            }
        }
        return Optional.empty();
    }

    @Override
    public boolean delete(UUID documentId, UUID userId) {
        try {
            Path filePath = baseDir.resolve(userId.toString()).resolve(documentId.toString() + ".pdf");
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted document: {}", documentId);
                return true;
            }
            return false;
        } catch (IOException e) {
            log.error("Failed to delete document: {}", documentId, e);
            return false;
        }
    }

    @Override
    public boolean exists(UUID documentId, UUID userId) {
        Path filePath = baseDir.resolve(userId.toString()).resolve(documentId.toString() + ".pdf");
        return Files.exists(filePath);
    }

    @Override
    public Optional<String> getStoragePath(UUID documentId, UUID userId) {
        Path filePath = baseDir.resolve(userId.toString()).resolve(documentId.toString() + ".pdf");
        return Files.exists(filePath) 
                ? Optional.of(filePath.toAbsolutePath().toString()) 
                : Optional.empty();
    }
}
