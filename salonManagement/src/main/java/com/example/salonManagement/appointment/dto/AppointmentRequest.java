package com.example.salonManagement.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record AppointmentRequest(
        Long customerId,
        String customerMobile,
        String customerFullName,
        String customerEmail,
        String customerGender,
        LocalDate customerDateOfBirth,

        @NotNull LocalDate appointmentDate,
        @NotNull LocalTime startTime,
        @NotBlank String source, // WALK_IN, ONLINE, FRONT_DESK
        String notes,

        @NotEmpty List<BookedServiceRequest> services
) {
    public record BookedServiceRequest(
            @NotNull Long serviceId,
            @NotNull Long assignedStylistId
    ) {}
}
