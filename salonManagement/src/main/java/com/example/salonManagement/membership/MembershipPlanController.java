package com.example.salonManagement.membership;

import com.example.salonManagement.membership.dto.MembershipPlanRequest;
import com.example.salonManagement.membership.dto.MembershipPlanResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/membership-plans")
@RequiredArgsConstructor
public class MembershipPlanController {

    private final MembershipService membershipService;

    @PostMapping
    public ResponseEntity<MembershipPlanResponse> createPlan(@RequestBody MembershipPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(membershipService.createPlan(request));
    }

    @GetMapping
    public ResponseEntity<List<MembershipPlanResponse>> getAllPlans() {
        return ResponseEntity.ok(membershipService.getAllPlans());
    }

    @PutMapping("/{id}")
    public ResponseEntity<MembershipPlanResponse> updatePlan(@PathVariable Long id, @RequestBody MembershipPlanRequest request) {
        return ResponseEntity.ok(membershipService.updatePlan(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        membershipService.deletePlan(id);
        return ResponseEntity.noContent().build();
    }
}
