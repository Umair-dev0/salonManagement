package com.example.salonManagement.appointment.dto;

import com.example.salonManagement.appointment.Appointment;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record AppointmentResponse(
        Long id,
        Long customerId,
        String customerName,
        String customerMobile,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        String status,
        String source,
        String notes,
        Long createdById,
        String createdByName,
        List<AppointmentServiceResponse> services
) {
    public static AppointmentResponse from(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getCustomer().getId(),
                appointment.getCustomer().getFullName(),
                appointment.getCustomer().getMobile(),
                appointment.getAppointmentDate(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getStatus(),
                appointment.getSource(),
                appointment.getNotes(),
                appointment.getCreatedBy() != null ? appointment.getCreatedBy().getId() : null,
                appointment.getCreatedBy() != null ? appointment.getCreatedBy().getFullName() : null,
                appointment.getServices() != null ?
                        appointment.getServices().stream().map(AppointmentServiceResponse::from).toList() : List.of()
        );
    }
}
