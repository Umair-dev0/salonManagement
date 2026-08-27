package com.example.salonManagement.appointment.dto;

import com.example.salonManagement.appointment.AppointmentServiceEntity;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record AppointmentServiceResponse(
        Long id,
        Long serviceId,
        String serviceName,
        Long assignedStylistId,
        String assignedStylistName,
        BigDecimal price,
        String status,
        boolean isAddon,
        ZonedDateTime startedAt,
        ZonedDateTime completedAt
) {
    public static AppointmentServiceResponse from(AppointmentServiceEntity entity) {
        return new AppointmentServiceResponse(
                entity.getId(),
                entity.getService().getId(),
                entity.getService().getName(),
                entity.getAssignedStylist().getId(),
                entity.getAssignedStylist().getFullName(),
                entity.getPrice(),
                entity.getStatus(),
                entity.isAddon(),
                entity.getStartedAt(),
                entity.getCompletedAt()
        );
    }
}
