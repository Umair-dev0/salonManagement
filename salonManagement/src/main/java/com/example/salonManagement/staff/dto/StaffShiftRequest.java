package com.example.salonManagement.staff.dto;

import jakarta.validation.constraints.*;
import java.time.LocalTime;

public record StaffShiftRequest(
        @NotNull(message = "User ID is required")
        Long userId,

        @Min(1) @Max(7)
        Short dayOfWeek,

        @NotNull(message = "Start time is required")
        LocalTime startTime,

        @NotNull(message = "End time is required")
        LocalTime endTime
) {}