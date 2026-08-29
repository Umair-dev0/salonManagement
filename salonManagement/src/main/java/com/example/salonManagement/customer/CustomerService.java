package com.example.salonManagement.customer;

import com.example.salonManagement.appointment.Appointment;
import com.example.salonManagement.appointment.AppointmentRepository;
import com.example.salonManagement.common.exception.ConflictException;
import com.example.salonManagement.common.exception.NotFoundException;
import com.example.salonManagement.customer.dto.CustomerHistoryResponse;
import com.example.salonManagement.customer.dto.CustomerRequest;
import com.example.salonManagement.customer.dto.CustomerResponse;
import com.example.salonManagement.membership.LoyaltyTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final AppointmentRepository appointmentRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;

    private CustomerResponse mapToResponse(Customer customer) {
        Integer visits = customerRepository.countVisitsByCustomerId(customer.getId());
        BigDecimal spent = customerRepository.sumSpentByCustomerId(customer.getId());
        Integer earn = loyaltyTransactionRepository.sumPointsByCustomerIdAndTxnType(customer.getId(), "EARN");
        Integer redeem = loyaltyTransactionRepository.sumPointsByCustomerIdAndTxnType(customer.getId(), "REDEEM");
        
        Integer activeLoyaltyPoints;
        if ((earn != null && earn > 0) || (redeem != null && redeem > 0)) {
            activeLoyaltyPoints = Math.max(0, (earn != null ? earn : 0) - (redeem != null ? redeem : 0));
        } else {
            activeLoyaltyPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        }

        return CustomerResponse.from(
                customer,
                visits != null ? visits : 0,
                spent != null ? spent : BigDecimal.ZERO,
                activeLoyaltyPoints
        );
    }

    // ==========================================
    // CREATE
    // ==========================================
    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        customerRepository.findByMobile(request.mobile()).ifPresent(c -> {
            throw new ConflictException("Mobile number already registered: " + request.mobile());
        });

        if (request.email() != null && !request.email().isBlank()) {
            customerRepository.findByEmail(request.email()).ifPresent(c -> {
                throw new ConflictException("Email already registered: " + request.email());
            });
        }

        Customer customer = new Customer();
        customer.setFullName(request.fullName());
        customer.setMobile(request.mobile());
        customer.setEmail(request.email());
        customer.setGender(request.gender());
        customer.setDateOfBirth(request.dateOfBirth());
        customer.setAnniversary(request.anniversary());
        customer.setPreferredStylistId(request.preferredStylistId());
        customer.setAllergies(request.allergies());
        customer.setNotes(request.notes());
        customer.setLoyaltyPoints(0);

        Customer saved = customerRepository.save(customer);
        return mapToResponse(saved);
    }

    // ==========================================
    // READ ALL with Pagination and Filter/Search
    // ==========================================
    @Transactional(readOnly = true)
    public Page<CustomerResponse> getCustomers(String query, boolean includeInactive, Pageable pageable) {
        Page<Customer> customersPage;
        if (query != null && !query.trim().isEmpty()) {
            customersPage = customerRepository.findByFullNameContainingIgnoreCaseOrMobileContaining(query, query, pageable);
        } else if (includeInactive) {
            customersPage = customerRepository.findAll(pageable);
        } else {
            customersPage = customerRepository.findAllByActiveTrue(pageable);
        }
        return customersPage.map(this::mapToResponse);
    }

    // ==========================================
    // READ SINGLE
    // ==========================================
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Customer not found with id: " + id));
        return mapToResponse(customer);
    }

    // ==========================================
    // UPDATE
    // ==========================================
    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Customer not found with id: " + id));

        if (!request.mobile().equals(customer.getMobile())) {
            customerRepository.findByMobile(request.mobile()).ifPresent(c -> {
                throw new ConflictException("Mobile number already registered: " + request.mobile());
            });
        }

        if (request.email() != null && !request.email().equals(customer.getEmail())) {
            customerRepository.findByEmail(request.email()).ifPresent(c -> {
                throw new ConflictException("Email already registered: " + request.email());
            });
        }

        customer.setFullName(request.fullName());
        customer.setMobile(request.mobile());
        customer.setEmail(request.email());
        customer.setGender(request.gender());
        customer.setDateOfBirth(request.dateOfBirth());
        customer.setAnniversary(request.anniversary());
        customer.setPreferredStylistId(request.preferredStylistId());
        customer.setAllergies(request.allergies());
        customer.setNotes(request.notes());

        Customer updated = customerRepository.save(customer);
        return mapToResponse(updated);
    }

    // SOFT DELETE
    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Customer not found with id: " + id));
        customer.setActive(false);
        customerRepository.save(customer);
    }

    @Transactional(readOnly = true)
    public CustomerHistoryResponse getCustomerHistory(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Customer not found with id: " + id));

        List<Appointment> appointments = appointmentRepository.findAllByCustomerIdOrderByAppointmentDateDesc(id);

        long completedCount = appointments.stream()
                .filter(a -> "COMPLETED".equals(a.getStatus()) || "BILLED".equals(a.getStatus()))
                .count();

        double totalSpent = appointments.stream()
                .filter(a -> "COMPLETED".equals(a.getStatus()) || "BILLED".equals(a.getStatus()))
                .flatMap(a -> a.getServices().stream())
                .mapToDouble(s -> s.getPrice().doubleValue())
                .sum();

        double averageTicketSize = completedCount > 0 ? (totalSpent / completedCount) : 0.0;

        LocalDate lastVisitDate = appointments.stream()
                .filter(a -> "COMPLETED".equals(a.getStatus()) || "BILLED".equals(a.getStatus()))
                .map(Appointment::getAppointmentDate)
                .findFirst()
                .orElse(null);

        List<CustomerHistoryResponse.AppointmentHistoryDto> appointmentDtos = appointments.stream().map(a -> {
            String stylistNames = a.getServices().stream()
                    .map(s -> s.getAssignedStylist().getFullName())
                    .distinct()
                    .reduce((x, y) -> x + ", " + y)
                    .orElse("N/A");

            double amount = a.getServices().stream()
                    .mapToDouble(s -> s.getPrice().doubleValue())
                    .sum();

            List<String> serviceNames = a.getServices().stream()
                    .map(s -> s.getService().getName())
                    .toList();

            return new CustomerHistoryResponse.AppointmentHistoryDto(
                    a.getId(),
                    a.getAppointmentDate(),
                    a.getStartTime().toString(),
                    stylistNames,
                    amount,
                    serviceNames,
                    a.getStatus()
            );
        }).toList();

        return new CustomerHistoryResponse(
                (int) completedCount,
                totalSpent,
                averageTicketSize,
                lastVisitDate,
                appointmentDtos
        );
    }
}
