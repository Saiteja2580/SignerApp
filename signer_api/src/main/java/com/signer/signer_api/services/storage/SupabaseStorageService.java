package com.signer.signer_api.services.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;
import java.util.UUID;


@Slf4j
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "supabase")
public class SupabaseStorageService implements DocumentStorageService {

    private final RestTemplate restTemplate;
    private final String supabaseUrl;
    private final String supabaseKey;
    private final String bucketName;

    public SupabaseStorageService(
            RestTemplate restTemplate,
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.key}") String supabaseKey,
            @Value("${supabase.bucket}") String bucketName) {
        this.restTemplate = restTemplate;
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.bucketName = bucketName;
    }

    @Override
    public String store(UUID documentId, UUID userId, byte[] content, String fileName) throws StorageException {
        try {
            String path = userId.toString() + "/" + documentId.toString() + ".pdf";
            String url = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, path);

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.setContentType(MediaType.APPLICATION_PDF);

            HttpEntity<byte[]> entity = new HttpEntity<>(content, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Stored document {} for user {} in Supabase bucket {}", documentId, userId, bucketName);
                return path;
            } else {
                throw new StorageException("Failed to store document in Supabase. Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Supabase store error: {}", e.getMessage());
            throw new StorageException("Supabase storage failure", e);
        }
    }

    @Override
    public Optional<byte[]> retrieve(UUID documentId, UUID userId) {
        try {
            String path = userId.toString() + "/" + documentId.toString() + ".pdf";
            String url = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, path);

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return Optional.ofNullable(response.getBody());
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Supabase retrieve error for document {}: {}", documentId, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public boolean delete(UUID documentId, UUID userId) {
        try {
            String path = userId.toString() + "/" + documentId.toString() + ".pdf";
            String url = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, path);

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Deleted document {} for user {} from Supabase", documentId, userId);
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Supabase delete error for document {}: {}", documentId, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean exists(UUID documentId, UUID userId) {
        try {
            String path = userId.toString() + "/" + documentId.toString() + ".pdf";
            String url = String.format("%s/storage/v1/object/info/%s/%s", supabaseUrl, bucketName, path);

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public Optional<String> getStoragePath(UUID documentId, UUID userId) {
        String path = userId.toString() + "/" + documentId.toString() + ".pdf";
        return Optional.of(path);
    }
}
