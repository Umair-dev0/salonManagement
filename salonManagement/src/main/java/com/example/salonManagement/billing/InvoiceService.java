package com.example.salonManagement.billing;

import com.example.salonManagement.appointment.Appointment;
import com.example.salonManagement.appointment.AppointmentRepository;
import com.example.salonManagement.appointment.AppointmentServiceEntity;
import com.example.salonManagement.billing.dto.InvoiceResponse;
import com.example.salonManagement.billing.dto.PaymentRequest;
import com.example.salonManagement.common.exception.ConflictException;
import com.example.salonManagement.common.exception.NotFoundException;
import com.example.salonManagement.customer.Customer;
import com.example.salonManagement.customer.CustomerRepository;
import com.example.salonManagement.service_catalog.Service;
import com.example.salonManagement.user.User;
import com.example.salonManagement.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Year;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    // ==========================================
    // CREATE DRAFT BILL FROM APPOINTMENT
    // ==========================================
    @Transactional
    public InvoiceResponse createDraftFromAppointment(Long appointmentId, String creatorEmail) {
        // Prevent duplicate draft bills for same session
        Optional<Invoice> existing = invoiceRepository.findByAppointmentId(appointmentId);
        if (existing.isPresent()) {
            return InvoiceResponse.from(existing.get());
        }

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Appointment not found with id: " + appointmentId));

        if (!"COMPLETED".equals(appointment.getStatus()) && !"IN_SERVICE".equals(appointment.getStatus())) {
            throw new ConflictException("Cannot generate bill. Appointment status must be IN_SERVICE or COMPLETED.");
        }

        Customer customer = appointment.getCustomer();
        User createdBy = creatorEmail != null ? userRepository.findByEmail(creatorEmail).orElse(null) : null;

        // Pricing Engine: check Member status and Weekend rules
        // Simulation: Customer is considered a Member if they have > 100 loyalty points (Phase 7 full integration later)
        boolean isMember = customer.getLoyaltyPoints() != null && customer.getLoyaltyPoints() >= 100;
        DayOfWeek day = appointment.getAppointmentDate().getDayOfWeek();
        boolean isWeekend = (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY);

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("TEMP-" + System.nanoTime());
        invoice.setAppointment(appointment);
        invoice.setCustomer(customer);
        invoice.setCreatedBy(createdBy);
        invoice.setPaymentStatus("DRAFT");
        invoice.setSubtotal(BigDecimal.ZERO);
        invoice.setTaxAmount(BigDecimal.ZERO);
        invoice.setTotalAmount(BigDecimal.ZERO);
        invoice.setDiscountAmount(BigDecimal.ZERO);

        // Pre-save to get auto-generated ID for line items relationship
        Invoice savedInvoice = invoiceRepository.save(invoice);

        BigDecimal subtotalAccumulator = BigDecimal.ZERO;
        BigDecimal taxAccumulator = BigDecimal.ZERO;
        List<InvoiceItem> lineItems = new ArrayList<>();

        for (AppointmentServiceEntity ase : appointment.getServices()) {
            Service service = ase.getService();

            // 1. Price Resolution Engine
            BigDecimal unitPrice = service.getBasePrice();
            if (isMember && service.getMemberPrice() != null) {
                unitPrice = service.getMemberPrice();
            } else if (isWeekend && service.getWeekendPrice() != null) {
                unitPrice = service.getWeekendPrice();
            }

            BigDecimal quantity = BigDecimal.ONE;
            BigDecimal lineTotal = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxPercent = service.getGstPercent() != null ? service.getGstPercent() : BigDecimal.valueOf(18.00);
            
            // Tax Calculation: tax = lineTotal * (taxPercent / 100)
            BigDecimal itemTax = lineTotal.multiply(taxPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            subtotalAccumulator = subtotalAccumulator.add(lineTotal);
            taxAccumulator = taxAccumulator.add(itemTax);

            InvoiceItem item = new InvoiceItem();
            item.setInvoice(savedInvoice);
            item.setItemType(ase.isAddon() ? "ADDON" : "SERVICE");
            item.setReferenceId(service.getId());
            item.setName(service.getName());
            item.setQuantity(quantity);
            item.setUnitPrice(unitPrice);
            item.setTaxPercent(taxPercent);
            item.setLineTotal(lineTotal);
            lineItems.add(item);
        }

        savedInvoice.setItems(lineItems);
        savedInvoice.setSubtotal(subtotalAccumulator);
        savedInvoice.setTaxAmount(taxAccumulator);
        savedInvoice.setTotalAmount(subtotalAccumulator.add(taxAccumulator).setScale(2, RoundingMode.HALF_UP));

        // Generate sequential invoice number: e.g. INV-2026-000001
        String invoiceNumber = String.format("INV-%d-%06d", Year.now().getValue(), savedInvoice.getId());
        savedInvoice.setInvoiceNumber(invoiceNumber);

        Invoice finalSaved = invoiceRepository.save(savedInvoice);
        return InvoiceResponse.from(finalSaved);
    }

    // ==========================================
    // GET INVOICE BY ID
    // ==========================================
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Invoice not found with id: " + id));
        return InvoiceResponse.from(invoice);
    }

    // ==========================================
    // RECORD PAYMENTS (Supports Split Payment checkouts)
    // ==========================================
    @Transactional
    public InvoiceResponse recordPayments(Long invoiceId, List<PaymentRequest> requests) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found with id: " + invoiceId));

        if ("PAID".equals(invoice.getPaymentStatus())) {
            throw new ConflictException("Invoice has already been paid in full.");
        }

        BigDecimal totalPaidSoFar = invoice.getPayments().stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal currentPaymentSum = requests.stream()
                .map(PaymentRequest::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grandTotalPaid = totalPaidSoFar.add(currentPaymentSum);

        // Save payment records
        for (PaymentRequest req : requests) {
            Payment payment = new Payment();
            payment.setInvoice(invoice);
            payment.setPaymentMode(req.paymentMode().toUpperCase());
            payment.setAmount(req.amount());
            payment.setReferenceNo(req.referenceNo());
            payment.setPaidAt(ZonedDateTime.now());
            paymentRepository.save(payment);
            invoice.getPayments().add(payment);
        }

        // Determine status transitions
        if (grandTotalPaid.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setPaymentStatus("PAID");

            // Post-payment actions:
            // 1. Credit loyalty points: Rs 100 spent = 1 loyalty point
            Customer customer = invoice.getCustomer();
            int pointsEarned = invoice.getTotalAmount().divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN).intValue();
            customer.setLoyaltyPoints(customer.getLoyaltyPoints() + pointsEarned);
            customerRepository.save(customer);

            // 2. Cascade Status change to Billed in Appointment
            if (invoice.getAppointment() != null) {
                invoice.getAppointment().setStatus("BILLED");
                appointmentRepository.save(invoice.getAppointment());
            }
        } else if (grandTotalPaid.compareTo(BigDecimal.ZERO) > 0) {
            invoice.setPaymentStatus("PARTIALLY_PAID");
        }

        Invoice updatedInvoice = invoiceRepository.save(invoice);
        return InvoiceResponse.from(updatedInvoice);
    }
}
