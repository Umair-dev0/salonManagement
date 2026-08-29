package com.example.salonManagement.billing;

import com.example.salonManagement.appointment.Appointment;
import com.example.salonManagement.appointment.AppointmentRepository;
import com.example.salonManagement.appointment.AppointmentServiceEntity;
import com.example.salonManagement.billing.dto.AddProductItemRequest;
import com.example.salonManagement.billing.dto.DirectSaleItemRequest;
import com.example.salonManagement.billing.dto.DirectSaleRequest;
import com.example.salonManagement.billing.dto.InvoiceResponse;
import com.example.salonManagement.billing.dto.PaymentRequest;
import com.example.salonManagement.common.exception.ConflictException;
import com.example.salonManagement.common.exception.InsufficientStockException;
import com.example.salonManagement.common.exception.NotFoundException;
import com.example.salonManagement.customer.Customer;
import com.example.salonManagement.customer.CustomerRepository;
import com.example.salonManagement.inventory.InventoryService;
import com.example.salonManagement.inventory.Product;
import com.example.salonManagement.inventory.ProductRepository;
import com.example.salonManagement.service_catalog.Service;
import com.example.salonManagement.user.User;
import com.example.salonManagement.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
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
    private final InventoryService inventoryService;
    private final ProductRepository productRepository;
    private final com.example.salonManagement.membership.LoyaltyService loyaltyService;
    private final com.example.salonManagement.membership.CustomerMembershipRepository customerMembershipRepository;

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

        // Pricing Engine: check active Membership Plan status and Weekend rules
        boolean isMember = customerMembershipRepository.findActiveMembershipByCustomerId(customer.getId(), ZonedDateTime.now()).isPresent();
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

            // Price Resolution Engine
            BigDecimal unitPrice = service.getBasePrice();
            if (isMember && service.getMemberPrice() != null) {
                unitPrice = service.getMemberPrice();
            } else if (isWeekend && service.getWeekendPrice() != null) {
                unitPrice = service.getWeekendPrice();
            }

            BigDecimal quantity = BigDecimal.ONE;
            BigDecimal lineTotal = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxPercent = service.getGstPercent() != null ? service.getGstPercent() : BigDecimal.valueOf(18.00);

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

        String invoiceNumber = String.format("INV-%d-%06d", Year.now().getValue(), savedInvoice.getId());
        savedInvoice.setInvoiceNumber(invoiceNumber);

        Invoice finalSaved = invoiceRepository.save(savedInvoice);
        return InvoiceResponse.from(finalSaved);
    }

    // ==========================================
    // CREATE DIRECT RETAIL SALE INVOICE
    // ==========================================
    @Transactional
    public InvoiceResponse createDirectSaleInvoice(DirectSaleRequest request, String creatorEmail) {
        Customer customer;
        if (request.customerId() != null) {
            customer = customerRepository.findById(request.customerId())
                    .orElseThrow(() -> new NotFoundException("Customer not found with id: " + request.customerId()));
        } else if (request.walkInCustomerMobile() != null && !request.walkInCustomerMobile().trim().isEmpty()) {
            String mobile = request.walkInCustomerMobile().trim();
            customer = customerRepository.findByMobile(mobile).orElseGet(() -> {
                Customer c = new Customer();
                c.setFullName(request.walkInCustomerName() != null && !request.walkInCustomerName().trim().isEmpty()
                        ? request.walkInCustomerName().trim() : "Walk-in Customer");
                c.setMobile(mobile);
                c.setLoyaltyPoints(0);
                return customerRepository.save(c);
            });
        } else {
            String walkInName = request.walkInCustomerName() != null && !request.walkInCustomerName().trim().isEmpty()
                    ? request.walkInCustomerName().trim() : "Walk-in Customer";
            customer = customerRepository.findByMobile("0000000000").orElseGet(() -> {
                Customer c = new Customer();
                c.setFullName(walkInName);
                c.setMobile("0000000000");
                c.setLoyaltyPoints(0);
                return customerRepository.save(c);
            });
        }

        User createdBy = creatorEmail != null ? userRepository.findByEmail(creatorEmail).orElse(null) : null;

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("TEMP-" + System.nanoTime());
        invoice.setAppointment(null);
        invoice.setCustomer(customer);
        invoice.setCreatedBy(createdBy);
        invoice.setPaymentStatus("DRAFT");
        invoice.setSubtotal(BigDecimal.ZERO);
        invoice.setTaxAmount(BigDecimal.ZERO);
        invoice.setTotalAmount(BigDecimal.ZERO);
        invoice.setDiscountAmount(request.discountAmount() != null ? request.discountAmount() : BigDecimal.ZERO);

        Invoice savedInvoice = invoiceRepository.save(invoice);

        BigDecimal subtotalAccumulator = BigDecimal.ZERO;
        BigDecimal taxAccumulator = BigDecimal.ZERO;
        List<InvoiceItem> lineItems = new ArrayList<>();

        for (DirectSaleItemRequest itemReq : request.items()) {
            Product product = productRepository.findByIdAndIsActiveTrue(itemReq.productId())
                    .orElseThrow(() -> new NotFoundException("Product not found with id: " + itemReq.productId()));

            if (itemReq.quantity().compareTo(product.getCurrentStock()) > 0) {
                throw new InsufficientStockException("Insufficient stock for product '" + product.getName()
                        + "'. Available stock: " + product.getCurrentStock() + ", requested: " + itemReq.quantity());
            }

            BigDecimal unitPrice = product.getSalePrice();
            BigDecimal quantity = itemReq.quantity();
            BigDecimal lineTotal = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxPercent = product.getGstPercent() != null ? product.getGstPercent() : new BigDecimal("18.00");
            BigDecimal itemTax = lineTotal.multiply(taxPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            subtotalAccumulator = subtotalAccumulator.add(lineTotal);
            taxAccumulator = taxAccumulator.add(itemTax);

            InvoiceItem item = new InvoiceItem();
            item.setInvoice(savedInvoice);
            item.setItemType("PRODUCT");
            item.setReferenceId(product.getId());
            item.setName(product.getName());
            item.setQuantity(quantity);
            item.setUnitPrice(unitPrice);
            item.setTaxPercent(taxPercent);
            item.setLineTotal(lineTotal);
            lineItems.add(item);
        }

        savedInvoice.setItems(lineItems);
        savedInvoice.setSubtotal(subtotalAccumulator);
        savedInvoice.setTaxAmount(taxAccumulator);

        BigDecimal grandTotal = subtotalAccumulator.add(taxAccumulator)
                .subtract(savedInvoice.getDiscountAmount())
                .setScale(2, RoundingMode.HALF_UP);
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) {
            grandTotal = BigDecimal.ZERO;
        }
        savedInvoice.setTotalAmount(grandTotal);

        String invoiceNumber = String.format("INV-%d-%06d", Year.now().getValue(), savedInvoice.getId());
        savedInvoice.setInvoiceNumber(invoiceNumber);

        // Record Payments
        if (request.payments() != null && !request.payments().isEmpty()) {
            BigDecimal paymentSum = BigDecimal.ZERO;
            for (PaymentRequest req : request.payments()) {
                Payment payment = new Payment();
                payment.setInvoice(savedInvoice);
                payment.setPaymentMode(req.paymentMode().toUpperCase());
                payment.setAmount(req.amount());
                payment.setReferenceNo(req.referenceNo());
                payment.setPaidAt(ZonedDateTime.now());
                paymentRepository.save(payment);
                savedInvoice.getPayments().add(payment);
                paymentSum = paymentSum.add(req.amount());
            }

            if (paymentSum.compareTo(savedInvoice.getTotalAmount()) >= 0) {
                savedInvoice.setPaymentStatus("PAID");

                // Atomically deduct inventory stock
                for (InvoiceItem item : savedInvoice.getItems()) {
                    inventoryService.recordSaleMovement(
                            item.getReferenceId(),
                            item.getQuantity(),
                            savedInvoice.getInvoiceNumber(),
                            "Direct Retail Counter Sale"
                    );
                }

                // Credit loyalty points: Rs 100 spent = 1 point via LoyaltyService ledger
                loyaltyService.creditPointsForInvoice(savedInvoice);
            } else if (paymentSum.compareTo(BigDecimal.ZERO) > 0) {
                savedInvoice.setPaymentStatus("PARTIALLY_PAID");
            }
        }

        Invoice finalSaved = invoiceRepository.save(savedInvoice);
        return InvoiceResponse.from(finalSaved);
    }

    // ==========================================
    // ADD PRODUCT TO DRAFT INVOICE
    // ==========================================
    @Transactional
    public InvoiceResponse addProductToInvoice(Long invoiceId, AddProductItemRequest request) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found with id: " + invoiceId));

        if ("PAID".equals(invoice.getPaymentStatus())) {
            throw new ConflictException("Cannot add product. Invoice is already paid.");
        }

        Product product = productRepository.findByIdAndIsActiveTrue(request.productId())
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + request.productId()));

        if (request.quantity().compareTo(product.getCurrentStock()) > 0) {
            throw new InsufficientStockException("Insufficient stock for product '" + product.getName()
                    + "'. Available stock: " + product.getCurrentStock() + ", requested: " + request.quantity());
        }

        Optional<InvoiceItem> existingItem = invoice.getItems().stream()
                .filter(i -> "PRODUCT".equals(i.getItemType()) && product.getId().equals(i.getReferenceId()))
                .findFirst();

        if (existingItem.isPresent()) {
            InvoiceItem item = existingItem.get();
            BigDecimal newQty = item.getQuantity().add(request.quantity());
            if (newQty.compareTo(product.getCurrentStock()) > 0) {
                throw new InsufficientStockException("Insufficient stock for product '" + product.getName()
                        + "'. Available stock: " + product.getCurrentStock() + ", total requested: " + newQty);
            }
            item.setQuantity(newQty);
            BigDecimal lineTotal = item.getUnitPrice().multiply(newQty).setScale(2, RoundingMode.HALF_UP);
            item.setLineTotal(lineTotal);
        } else {
            BigDecimal unitPrice = product.getSalePrice();
            BigDecimal quantity = request.quantity();
            BigDecimal lineTotal = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxPercent = product.getGstPercent() != null ? product.getGstPercent() : new BigDecimal("18.00");

            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
            item.setItemType("PRODUCT");
            item.setReferenceId(product.getId());
            item.setName(product.getName());
            item.setQuantity(quantity);
            item.setUnitPrice(unitPrice);
            item.setTaxPercent(taxPercent);
            item.setLineTotal(lineTotal);
            invoice.getItems().add(item);
        }

        recalculateInvoiceTotals(invoice);
        Invoice saved = invoiceRepository.save(invoice);
        return InvoiceResponse.from(saved);
    }

    // ==========================================
    // REMOVE INVOICE ITEM
    // ==========================================
    @Transactional
    public InvoiceResponse removeInvoiceItem(Long invoiceId, Long itemId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found with id: " + invoiceId));

        if ("PAID".equals(invoice.getPaymentStatus())) {
            throw new ConflictException("Cannot remove item. Invoice is already paid.");
        }

        boolean removed = invoice.getItems().removeIf(item -> item.getId().equals(itemId));
        if (!removed) {
            throw new NotFoundException("Item not found on invoice with id: " + itemId);
        }

        recalculateInvoiceTotals(invoice);
        Invoice saved = invoiceRepository.save(invoice);
        return InvoiceResponse.from(saved);
    }

    private void recalculateInvoiceTotals(Invoice invoice) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;

        for (InvoiceItem item : invoice.getItems()) {
            subtotal = subtotal.add(item.getLineTotal());
            BigDecimal taxPercent = item.getTaxPercent() != null ? item.getTaxPercent() : new BigDecimal("18.00");
            BigDecimal itemTax = item.getLineTotal().multiply(taxPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            tax = tax.add(itemTax);
        }

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(tax);
        BigDecimal discount = invoice.getDiscountAmount() != null ? invoice.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal total = subtotal.add(tax).subtract(discount).setScale(2, RoundingMode.HALF_UP);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }
        invoice.setTotalAmount(total);
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
            // 1. Credit loyalty points: Rs 100 spent = 1 loyalty point via LoyaltyService ledger
            loyaltyService.creditPointsForInvoice(invoice);

            // 2. Cascade Status change to Billed in Appointment
            if (invoice.getAppointment() != null) {
                invoice.getAppointment().setStatus("BILLED");
                appointmentRepository.save(invoice.getAppointment());

                // 3. Deduct inventory stock for product line items attached to appointment bill
                for (InvoiceItem item : invoice.getItems()) {
                    if ("PRODUCT".equalsIgnoreCase(item.getItemType())) {
                        inventoryService.recordSaleMovement(
                                item.getReferenceId(),
                                item.getQuantity(),
                                invoice.getInvoiceNumber(),
                                "Appointment Retail Product Sale"
                        );
                    }
                }
            }
        } else if (grandTotalPaid.compareTo(BigDecimal.ZERO) > 0) {
            invoice.setPaymentStatus("PARTIALLY_PAID");
        }

        Invoice updatedInvoice = invoiceRepository.save(invoice);
        return InvoiceResponse.from(updatedInvoice);
    }
}
