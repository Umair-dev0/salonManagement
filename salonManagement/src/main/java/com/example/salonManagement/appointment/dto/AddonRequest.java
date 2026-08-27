package com.example.salonManagement.appointment.dto;

import jakarta.validation.constraints.NotNull;

public record AddonRequest(
        @NotNull(message = "Service ID is required")
        Long serviceId
) {}
