package com.example.salonManagement.user;

import com.example.salonManagement.common.exception.ConflictException;
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

}
