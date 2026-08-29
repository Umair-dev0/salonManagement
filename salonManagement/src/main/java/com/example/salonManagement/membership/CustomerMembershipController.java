package com.example.salonManagement.membership;

import com.example.salonManagement.membership.dto.CustomerMembershipResponse;
import com.example.salonManagement.membership.dto.SubscribeMembershipRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer-memberships")
@RequiredArgsConstructor
public class CustomerMembershipController {

    private final MembershipService membershipService;

    @PostMapping("/subscribe")
    public ResponseEntity<CustomerMembershipResponse> subscribeCustomer(@RequestBody SubscribeMembershipRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(membershipService.subscribeCustomer(request));
    }

    @GetMapping
    public ResponseEntity<List<CustomerMembershipResponse>> getAllSubscriptions() {
        return ResponseEntity.ok(membershipService.getAllSubscriptions());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<CustomerMembershipResponse> getActiveMembership(@PathVariable Long customerId) {
        return membershipService.getActiveMembership(customerId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
