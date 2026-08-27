package com.example.salonManagement.customer;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.customer.dto.CustomerHistoryResponse;
import com.example.salonManagement.customer.dto.CustomerRequest;
import com.example.salonManagement.customer.dto.CustomerResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    // GET /api/customers?page=0&size=20&q=...
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<Page<CustomerResponse>> getCustomers(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "includeInactive", required = false, defaultValue = "false") boolean includeInactive) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<CustomerResponse> result = customerService.getCustomers(query, includeInactive, pageable);
        return ApiResponse.ok(result);
    }

    // GET /api/customers/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<CustomerResponse> getCustomerById(@PathVariable Long id) {
        return ApiResponse.ok(customerService.getCustomerById(id));
    }

    // GET /api/customers/{id}/history
    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<CustomerHistoryResponse> getCustomerHistory(@PathVariable Long id) {
        return ApiResponse.ok(customerService.getCustomerHistory(id));
    }

    // POST /api/customers
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<CustomerResponse> createCustomer(@Valid @RequestBody CustomerRequest request) {
        return ApiResponse.ok(customerService.createCustomer(request));
    }

    // PUT /api/customers/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<CustomerResponse> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequest request) {
        return ApiResponse.ok(customerService.updateCustomer(id, request));
    }

    // DELETE /api/customers/{id} (Returns 204 No Content status code)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public void deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
    }
}
