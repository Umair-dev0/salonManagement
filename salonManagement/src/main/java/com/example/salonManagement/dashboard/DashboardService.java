package com.example.salonManagement.dashboard;

import com.example.salonManagement.appointment.Appointment;
import com.example.salonManagement.appointment.AppointmentRepository;
import com.example.salonManagement.appointment.dto.AppointmentResponse;
import com.example.salonManagement.billing.Invoice;
import com.example.salonManagement.billing.InvoiceRepository;
import com.example.salonManagement.billing.Payment;
import com.example.salonManagement.billing.PaymentRepository;
import com.example.salonManagement.customer.CustomerRepository;
import com.example.salonManagement.dashboard.dto.DashboardStatsResponse;
import com.example.salonManagement.dashboard.dto.PaymentModeBreakdown;
import com.example.salonManagement.inventory.Product;
import com.example.salonManagement.inventory.ProductRepository;
import com.example.salonManagement.inventory.dto.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class DashboardService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getExecutiveDashboardStats() {
        LocalDate today = LocalDate.now();
        ZonedDateTime startOfDay = today.atStartOfDay(ZoneId.systemDefault());
        ZonedDateTime endOfDay = today.atTime(LocalTime.MAX).atZone(ZoneId.systemDefault());

        // 1. Today's Payments & Total Revenue Calculation
        List<Payment> todayPayments = paymentRepository.findAllByPaidAtBetween(startOfDay, endOfDay);
        BigDecimal todaySales = todayPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Fallback: If no payment records found by paidAt, check paid invoices created today
        if (todaySales.compareTo(BigDecimal.ZERO) == 0) {
            List<Invoice> todayInvoices = invoiceRepository.findAllByCreatedAtBetween(startOfDay, endOfDay);
            todaySales = todayInvoices.stream()
                    .filter(inv -> "PAID".equalsIgnoreCase(inv.getPaymentStatus()))
                    .map(Invoice::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // 2. Today's Appointments & Sessions
        List<Appointment> todayAppointments = appointmentRepository.findAllByAppointmentDate(today);

        long totalAppts = todayAppointments.size();
        long scheduled = todayAppointments.stream().filter(a -> "SCHEDULED".equalsIgnoreCase(a.getStatus()) || "CONFIRMED".equalsIgnoreCase(a.getStatus())).count();
        long inService = todayAppointments.stream().filter(a -> "IN_SERVICE".equalsIgnoreCase(a.getStatus())).count();
        long completed = todayAppointments.stream().filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus())).count();
        long billed = todayAppointments.stream().filter(a -> "BILLED".equalsIgnoreCase(a.getStatus())).count();
        long cancelled = todayAppointments.stream().filter(a -> "CANCELLED".equalsIgnoreCase(a.getStatus())).count();

        List<AppointmentResponse> todaySessions = todayAppointments.stream()
                .map(appt -> {
                    Optional<Invoice> invoiceOpt = invoiceRepository.findByAppointmentId(appt.getId());
                    if (invoiceOpt.isPresent()) {
                        return AppointmentResponse.from(appt, invoiceOpt.get().getTotalAmount());
                    }
                    return AppointmentResponse.from(appt);
                })
                .toList();


        // 3. Total Active Registered Clients
        long totalClients = customerRepository.countByActiveTrue();

        // 4. Low Stock Inventory Alerts
        List<Product> lowStockProducts = productRepository.findLowStockProducts();
        long lowStockCount = lowStockProducts.size();
        List<ProductResponse> criticalInventoryItems = lowStockProducts.stream()
                .map(ProductResponse::from)
                .toList();

        // 5. Payment Mode Breakdown
        Map<String, List<Payment>> paymentsByMode = todayPayments.stream()
                .collect(Collectors.groupingBy(p -> p.getPaymentMode() != null ? p.getPaymentMode().toUpperCase() : "CASH"));

        List<PaymentModeBreakdown> paymentModeSplit = new ArrayList<>();
        for (Map.Entry<String, List<Payment>> entry : paymentsByMode.entrySet()) {
            String mode = entry.getKey();
            List<Payment> modePayments = entry.getValue();
            BigDecimal modeAmount = modePayments.stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long modeCount = modePayments.size();

            BigDecimal percentage = BigDecimal.ZERO;
            if (todaySales.compareTo(BigDecimal.ZERO) > 0) {
                percentage = modeAmount.multiply(BigDecimal.valueOf(100))
                        .divide(todaySales, 2, RoundingMode.HALF_UP);
            }

            paymentModeSplit.add(new PaymentModeBreakdown(mode, modeAmount, modeCount, percentage));
        }

        return new DashboardStatsResponse(
                todaySales,
                totalAppts,
                scheduled,
                inService,
                completed,
                billed,
                cancelled,
                totalClients,
                lowStockCount,
                todaySessions,
                criticalInventoryItems,
                paymentModeSplit
        );
    }
}
