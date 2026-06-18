package com.example.salonManagement.user;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.user.dto.UserRequest;
import com.example.salonManagement.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody UserRequest request) {
        // Validation pass hone ke baad, request Service layer me jayegi
        UserResponse response = userService.createUser(request);
        // Response ko standard format (ApiResponse) me wrap karke bhejenge
        return ApiResponse.ok(response);
    }
}