package com.example.salonManagement.marketing;

import com.example.salonManagement.billing.Invoice;
import com.example.salonManagement.common.exception.ConflictException;
import com.example.salonManagement.common.exception.NotFoundException;
import com.example.salonManagement.customer.Customer;
import com.example.salonManagement.customer.CustomerRepository;
import com.example.salonManagement.marketing.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public CouponResponse createCoupon(CouponRequest request) {
        couponRepository.findByCodeIgnoreCase(request.code()).ifPresent(c -> {
            throw new ConflictException("Coupon code already exists: " + request.code());
        });

        Coupon coupon = Coupon.builder()
                .code(request.code().toUpperCase().trim())
                .discountType(request.discountType().toUpperCase().trim())
                .value(request.value())
                .minBillAmount(request.minBillAmount() != null ? request.minBillAmount() : BigDecimal.ZERO)
                .maxDiscount(request.maxDiscount())
                .maxUses(request.maxUses())
                .usedCount(0)
                .validFrom(request.validFrom() != null ? request.validFrom() : ZonedDateTime.now())
                .validTo(request.validTo() != null ? request.validTo() : ZonedDateTime.now().plusDays(30))
                .active(true)
                .build();

        Coupon saved = couponRepository.save(coupon);
        return CouponResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> getAllCoupons() {
        return couponRepository.findAll().stream()
                .map(CouponResponse::from)
                .toList();
    }

    @Transactional
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Coupon not found with id: " + id));

        coupon.setCode(request.code().toUpperCase().trim());
        coupon.setDiscountType(request.discountType().toUpperCase().trim());
        coupon.setValue(request.value());
        coupon.setMinBillAmount(request.minBillAmount() != null ? request.minBillAmount() : BigDecimal.ZERO);
        coupon.setMaxDiscount(request.maxDiscount());
        coupon.setMaxUses(request.maxUses());
        if (request.validFrom() != null) coupon.setValidFrom(request.validFrom());
        if (request.validTo() != null) coupon.setValidTo(request.validTo());

        Coupon updated = couponRepository.save(coupon);
        return CouponResponse.from(updated);
    }

    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Coupon not found with id: " + id));
        coupon.setActive(false);
        couponRepository.save(coupon);
    }

    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(CouponValidateRequest request) {
        if (request.code() == null || request.code().trim().isEmpty()) {
            return new CouponValidationResponse(false, "Coupon code cannot be empty.", null, BigDecimal.ZERO, BigDecimal.ZERO, null, null);
        }

        String code = request.code().toUpperCase().trim();
        Optional<Coupon> optionalCoupon = couponRepository.findByCodeIgnoreCase(code);

        if (optionalCoupon.isEmpty()) {
            return new CouponValidationResponse(false, "Invalid coupon code '" + code + "'.", null, BigDecimal.ZERO, BigDecimal.ZERO, null, code);
        }

        Coupon coupon = optionalCoupon.get();

        if (!coupon.isActive()) {
            return new CouponValidationResponse(false, "Coupon '" + code + "' is inactive.", null, BigDecimal.ZERO, BigDecimal.ZERO, coupon.getId(), code);
        }

        ZonedDateTime now = ZonedDateTime.now();
        if (now.isBefore(coupon.getValidFrom()) || now.isAfter(coupon.getValidTo())) {
            return new CouponValidationResponse(false, "Coupon '" + code + "' is expired or not yet valid.", null, BigDecimal.ZERO, BigDecimal.ZERO, coupon.getId(), code);
        }

        BigDecimal billAmount = request.billAmount() != null ? request.billAmount() : BigDecimal.ZERO;
        if (coupon.getMinBillAmount() != null && billAmount.compareTo(coupon.getMinBillAmount()) < 0) {
            return new CouponValidationResponse(false, "Minimum bill amount for coupon '" + code + "' is ₹" + coupon.getMinBillAmount(), null, BigDecimal.ZERO, BigDecimal.ZERO, coupon.getId(), code);
        }

        if (coupon.getMaxUses() != null && coupon.getUsedCount() >= coupon.getMaxUses()) {
            return new CouponValidationResponse(false, "Coupon '" + code + "' maximum usage limit reached.", null, BigDecimal.ZERO, BigDecimal.ZERO, coupon.getId(), code);
        }

        if (request.customerId() != null) {
            long usesByCustomer = couponUsageRepository.countByCouponIdAndCustomerId(coupon.getId(), request.customerId());
            if (usesByCustomer > 0) {
                return new CouponValidationResponse(false, "Coupon '" + code + "' has already been redeemed by this customer.", null, BigDecimal.ZERO, BigDecimal.ZERO, coupon.getId(), code);
            }
        }

        // Calculate discount amount
        BigDecimal discountAmount;
        if ("PERCENT".equalsIgnoreCase(coupon.getDiscountType())) {
            discountAmount = billAmount.multiply(coupon.getValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscount() != null && discountAmount.compareTo(coupon.getMaxDiscount()) > 0) {
                discountAmount = coupon.getMaxDiscount();
            }
        } else {
            // FLAT
            discountAmount = coupon.getValue();
            if (discountAmount.compareTo(billAmount) > 0) {
                discountAmount = billAmount;
            }
        }

        return new CouponValidationResponse(true, "Coupon applied successfully!", coupon.getDiscountType(), coupon.getValue(), discountAmount, coupon.getId(), code);
    }

    @Transactional
    public void recordCouponUsage(Long couponId, Long customerId, Invoice invoice) {
        Coupon coupon = couponRepository.findById(couponId).orElse(null);
        Customer customer = customerRepository.findById(customerId).orElse(null);

        if (coupon != null && customer != null) {
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);

            CouponUsage usage = CouponUsage.builder()
                    .coupon(coupon)
                    .customer(customer)
                    .invoice(invoice)
                    .build();
            couponUsageRepository.save(usage);
        }
    }
}
