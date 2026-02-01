package com.signer.signer_api.models.dto.common;

import java.util.List;

/**
 * Generic DTO for paginated responses.
 */
public record PageResponseDto<T>(
    List<T> content,
    long totalItems,
    int totalPages,
    int currentPage,
    int pageSize,
    int itemsOnPage
) {}
