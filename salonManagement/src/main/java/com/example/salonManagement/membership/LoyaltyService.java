package com.example.salonManagement.membership;

import com.example.salonManagement.billing.Invoice;
import com.example.salonManagement.billing.InvoiceRepository;
import com.example.salonManagement.common.exception.ConflictException;
import com.example.salonManagement.common.exception.NotFoundException;
import com.example.salonManagement.customer.Customer;
import com.example.salonManagement.customer.CustomerRepository;
import com.example.salonManagement.membership.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional
    public void creditPointsForInvoice(Invoice invoice) {
        if (invoice == null || invoice.getCustomer() == null || invoice.getTotalAmount() == null) {
            return;
        }

        // 1 point per 100 spent
        int pointsToCredit = invoice.getTotalAmount().divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN).intValue();
        if (pointsToCredit <= 0) {
            return;
        }

        Customer customer = invoice.getCustomer();
        LoyaltyTransaction txn = LoyaltyTransaction.builder()
                .customer(customer)
                .txnType("EARN")
                .points(pointsToCredit)
                .invoice(invoice)
                .notes("Earned 1 pt per ₹100 spent on invoice " + invoice.getInvoiceNumber())
                .build();

        loyaltyTransactionRepository.save(txn);

        // Sync customer table cache
        syncCustomerLoyaltyPoints(customer.getId());
    }

    @Transactional
    public LoyaltyLedgerResponse redeemPoints(Long customerId, LoyaltyRedeemRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found with id: " + customerId));

        if (request.points() == null || request.points() <= 0) {
            throw new ConflictException("Points to redeem must be greater than zero.");
        }

        int activePoints = getActiveBalance(customerId);
        if (request.points() > activePoints) {
            throw new ConflictException("Insufficient loyalty points! Available: " + activePoints + ", requested: " + request.points());
        }

        Invoice invoice = null;
        if (request.invoiceId() != null) {
            invoice = invoiceRepository.findById(request.invoiceId())
                    .orElseThrow(() -> new NotFoundException("Invoice not found with id: " + request.invoiceId()));

            // Apply redemption discount (₹1 per point)
            BigDecimal discountVal = BigDecimal.valueOf(request.points());
            BigDecimal currentDiscount = invoice.getDiscountAmount() != null ? invoice.getDiscountAmount() : BigDecimal.ZERO;
            invoice.setDiscountAmount(currentDiscount.add(discountVal));
            
            BigDecimal subtotal = invoice.getSubtotal() != null ? invoice.getSubtotal() : BigDecimal.ZERO;
            BigDecimal tax = invoice.getTaxAmount() != null ? invoice.getTaxAmount() : BigDecimal.ZERO;
            BigDecimal grandTotal = subtotal.add(tax).subtract(invoice.getDiscountAmount()).setScale(2, RoundingMode.HALF_UP);
            if (grandTotal.compareTo(BigDecimal.ZERO) < 0) {
                grandTotal = BigDecimal.ZERO;
            }
            invoice.setTotalAmount(grandTotal);
            invoiceRepository.save(invoice);
        }

        LoyaltyTransaction txn = LoyaltyTransaction.builder()
                .customer(customer)
                .txnType("REDEEM")
                .points(request.points())
                .invoice(invoice)
                .notes("Redeemed " + request.points() + " pts (₹" + request.points() + " discount) on invoice " + (invoice != null ? invoice.getInvoiceNumber() : "N/A"))
                .build();

        LoyaltyTransaction saved = loyaltyTransactionRepository.save(txn);
        syncCustomerLoyaltyPoints(customerId);
        return LoyaltyLedgerResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public int getActiveBalance(Long customerId) {
        Integer earn = loyaltyTransactionRepository.sumPointsByCustomerIdAndTxnType(customerId, "EARN");
        Integer redeem = loyaltyTransactionRepository.sumPointsByCustomerIdAndTxnType(customerId, "REDEEM");
        int e = earn != null ? earn : 0;
        int r = redeem != null ? redeem : 0;
        
        if (e == 0 && r == 0) {
            Customer customer = customerRepository.findById(customerId).orElse(null);
            return customer != null && customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        }
        return Math.max(0, e - r);
    }

    @Transactional(readOnly = true)
    public LoyaltySummaryResponse getSummary(Long customerId) {
        Integer earn = loyaltyTransactionRepository.sumPointsByCustomerIdAndTxnType(customerId, "EARN");
        Integer redeem = loyaltyTransactionRepository.sumPointsByCustomerIdAndTxnType(customerId, "REDEEM");
        int e = earn != null ? earn : 0;
        int r = redeem != null ? redeem : 0;
        return new LoyaltySummaryResponse(e, r, Math.max(0, e - r));
    }

    @Transactional(readOnly = true)
    public List<LoyaltyLedgerResponse> getCustomerLedger(Long customerId) {
        return loyaltyTransactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(LoyaltyLedgerResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LoyaltyLedgerResponse> getAllLedger() {
        return loyaltyTransactionRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(LoyaltyLedgerResponse::from)
                .toList();
    }

    private void syncCustomerLoyaltyPoints(Long customerId) {
        Customer customer = customerRepository.findById(customerId).orElse(null);
        if (customer != null) {
            int active = getActiveBalance(customerId);
            customer.setLoyaltyPoints(active);
            customerRepository.save(customer);
        }
    }
}
