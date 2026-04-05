package com.wct.rcdo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UpdateRallyCryRequest(
        @NotBlank(message = "Name must not be blank") String name,
        String description,
        @Min(value = 0, message = "Sort order must be zero or greater") int sortOrder
) {
}
