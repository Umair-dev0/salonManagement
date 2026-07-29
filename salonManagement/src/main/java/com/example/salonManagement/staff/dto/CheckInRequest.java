package com.example.salonManagement.staff.dto;

import jakarta.validation.constraints.NotNull;

public record CheckInRequest(
        @NotNull(message = "User ID is required")
        Long userId
) {}