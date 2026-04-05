package com.wct.rcdo.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateRallyCryRequest(
        @NotBlank(message = "Name must not be blank") String name,
        String description
) {
}
