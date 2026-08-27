package com.example.salonManagement.customer.dto;

import java.time.LocalDate;
import java.util.List;

public record CustomerHistoryResponse(
        Integer totalVisits,
        Double totalSpent,
        Double averageTicketSize,
        LocalDate lastVisitDate,
        List<AppointmentHistoryDto> appointments
) {
    public record AppointmentHistoryDto(
            Long id,
            LocalDate date,
            String time,
            String stylistName,
            Double amountPaid,
            List<String> services,
            String status
    ) {}
}
