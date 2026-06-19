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
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody UserRequest request) {
        // Validation pass hone ke baad, request Service layer me jayegi
        UserResponse response = userService.createUser(request);
        // Response ko standard format (ApiResponse) me wrap karke bhejenge
        return ApiResponse.ok(response);
    }
    // UserService ko inject karne ke baad aur createUser ke niche yeh add karein:

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')") // Sirf Owner update kar sakta hai
    public ApiResponse<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserRequest request) {

        UserResponse response = userService.updateUser(id, request);
        return ApiResponse.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')") // Sirf Owner delete kar sakta hai
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {

        userService.deleteUser(id);

        // Delete ke baad PDF ke according data me kuch return nahi karna chahiye
        return new ApiResponse<>(true, null, "User deleted successfully", null);
    }

    // NAYA CODE: Get All Users Endpoint
    @GetMapping
    @PreAuthorize("hasRole('OWNER')") // Sirf OWNER saare staff ki list dekh sakta hai
    public ApiResponse<java.util.List<UserResponse>> getAllUsers() {
        java.util.List<UserResponse> users = userService.getAllUsers();
        return ApiResponse.ok(users);
    }

    // NAYA CODE: Get Single User Endpoint
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')") // Sirf OWNER specific staff ki details dekh sakta hai
    public ApiResponse<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ApiResponse.ok(response);
    }
}