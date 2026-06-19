package com.example.salonManagement.auth;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.auth.dto.LoginRequest;
import com.example.salonManagement.auth.dto.LoginResponse;
import com.example.salonManagement.security.CustomUserDetails;
import com.example.salonManagement.security.JwtService;
import com.example.salonManagement.user.User;
import com.example.salonManagement.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        // Authenticate credentials via Spring Security AuthenticationManager
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        // Generate token
        String token = jwtService.generateToken(userDetails, user.getId(), user.getRole());

        // Return wrapped response
        LoginResponse loginResponse = new LoginResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );

        return ApiResponse.ok(loginResponse);
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            return ApiResponse.error("Not authenticated");
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        UserResponse userResponse = UserResponse.from(userDetails.getUser());
        return ApiResponse.ok(userResponse);
    }
}
