package com.example.salonManagement.user;

import com.example.salonManagement.common.exception.ConflictException;
import com.example.salonManagement.common.exception.NotFoundException;
import com.example.salonManagement.user.dto.UserRequest;
import com.example.salonManagement.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createUser(UserRequest request) {
        // Manual validation for required fields at creation
        if (request.email() == null || request.email().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        // 1. Check for duplicate email
        userRepository.findByEmail(request.email()).ifPresent(u -> {
            throw new ConflictException("Email already exists: " + request.email());
        });
        // check for duplicate number
        if (request.phone() != null) {
            userRepository.findByPhone(request.phone()).ifPresent(u -> {
                throw new ConflictException("Phone number already exists: " + request.phone());
            });
        }
        // 2. Map DTO to Entity
        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPhone(request.phone());

        // 3. Hash the password before saving
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        user.setRole(request.role());
        user.setSpecialization(request.specialization());

        //default joining dates
        user.setJoiningDate(java.time.LocalDate.now());

        // 4. Save to Database
        User savedUser = userRepository.save(user);

        // 5. Convert back to Response DTO
        return UserResponse.from(savedUser);
    }

    // NAYA CODE: Update User
    @Transactional
    public UserResponse updateUser(Long id, UserRequest request) {
        // Pehle check karo user exist karta hai ya nahi
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + id));

        // Agar naya phone number aaya hai, toh duplicate check karo (current user ko chhod kar)
        if (request.phone() != null && !request.phone().equals(user.getPhone())) {
            userRepository.findByPhone(request.phone()).ifPresent(u -> {
                throw new ConflictException("Phone number already exists: " + request.phone());
            });
        }

        // Details update karo
        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        user.setRole(request.role());
        user.setSpecialization(request.specialization());

        // Update password if a new one is provided (not blank)
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        User updatedUser = userRepository.save(user);
        return UserResponse.from(updatedUser);
    }

    // NAYA CODE: Soft Delete User
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + id));

        // Hard delete (repository.delete) ki jagah sirf flag false karenge
        user.setActive(false);
        userRepository.save(user);
    }

    // NAYA CODE: Get All Users
    @Transactional(readOnly = true)
    public java.util.List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from) // Entity ko Response DTO me convert kar rahe hain
                .toList();
    }

    // NAYA CODE: Get Single User By ID
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + id));

        return UserResponse.from(user);
    }

}
