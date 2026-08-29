package com.example.salonManagement.membership;

import com.example.salonManagement.common.exception.ConflictException;
import com.example.salonManagement.common.exception.NotFoundException;
import com.example.salonManagement.customer.Customer;
import com.example.salonManagement.customer.CustomerRepository;
import com.example.salonManagement.membership.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MembershipService {

    private final MembershipPlanRepository planRepository;
    private final CustomerMembershipRepository customerMembershipRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public MembershipPlanResponse createPlan(MembershipPlanRequest request) {
        MembershipPlan plan = MembershipPlan.builder()
                .name(request.name())
                .tier(request.tier().toUpperCase())
                .price(request.price())
                .discountPercent(request.discountPercent() != null ? request.discountPercent() : BigDecimal.ZERO)
                .walletValue(request.walletValue() != null ? request.walletValue() : BigDecimal.ZERO)
                .validityDays(request.validityDays() != null ? request.validityDays() : 365)
                .active(true)
                .build();

        MembershipPlan saved = planRepository.save(plan);
        return MembershipPlanResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<MembershipPlanResponse> getAllPlans() {
        return planRepository.findAll().stream()
                .map(MembershipPlanResponse::from)
                .toList();
    }

    @Transactional
    public MembershipPlanResponse updatePlan(Long id, MembershipPlanRequest request) {
        MembershipPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Membership plan not found with id: " + id));

        plan.setName(request.name());
        plan.setTier(request.tier().toUpperCase());
        plan.setPrice(request.price());
        plan.setDiscountPercent(request.discountPercent() != null ? request.discountPercent() : BigDecimal.ZERO);
        plan.setWalletValue(request.walletValue() != null ? request.walletValue() : BigDecimal.ZERO);
        plan.setValidityDays(request.validityDays() != null ? request.validityDays() : 365);

        MembershipPlan updated = planRepository.save(plan);
        return MembershipPlanResponse.from(updated);
    }

    @Transactional
    public void deletePlan(Long id) {
        MembershipPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Membership plan not found with id: " + id));
        plan.setActive(false);
        planRepository.save(plan);
    }

    @Transactional
    public CustomerMembershipResponse subscribeCustomer(SubscribeMembershipRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new NotFoundException("Customer not found with id: " + request.customerId()));

        MembershipPlan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new NotFoundException("Membership plan not found with id: " + request.planId()));

        if (!plan.isActive()) {
            throw new ConflictException("Cannot subscribe to an inactive membership plan.");
        }

        ZonedDateTime now = ZonedDateTime.now();
        ZonedDateTime expiryDate = now.plusDays(plan.getValidityDays());

        CustomerMembership membership = CustomerMembership.builder()
                .customer(customer)
                .plan(plan)
                .startDate(now)
                .expiryDate(expiryDate)
                .walletBalance(plan.getWalletValue())
                .status("ACTIVE")
                .build();

        CustomerMembership saved = customerMembershipRepository.save(membership);
        return CustomerMembershipResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<CustomerMembershipResponse> getAllSubscriptions() {
        return customerMembershipRepository.findAll().stream()
                .map(CustomerMembershipResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<CustomerMembershipResponse> getActiveMembership(Long customerId) {
        return customerMembershipRepository.findActiveMembershipByCustomerId(customerId, ZonedDateTime.now())
                .map(CustomerMembershipResponse::from);
    }
}
