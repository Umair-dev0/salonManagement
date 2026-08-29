package com.example.salonManagement.dashboard.dto;

import com.example.salonManagement.appointment.dto.AppointmentResponse;
import com.example.salonManagement.inventory.dto.ProductResponse;

import java.math.BigDecimal;
import java.util.List;

public record DashboardStatsResponse(
        BigDecimal todaySales,
        long todayAppointmentsTotal,
        long todayAppointmentsScheduled,
        long todayAppointmentsInService,
        long todayAppointmentsCompleted,
        long todayAppointmentsBilled,
        long todayAppointmentsCancelled,
        long totalClients,
        long lowStockAlertCount,
        List<AppointmentResponse> todaySessions,
        List<ProductResponse> criticalInventoryItems,
        List<PaymentModeBreakdown> paymentModeSplit
) {}
