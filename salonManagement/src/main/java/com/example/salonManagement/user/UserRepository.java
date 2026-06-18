package com.example.salonManagement.user;


import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UserRepository extends JpaRepository<User, Long> {
    // Aage chalkar login ke time user ko email se dhundhne ke liye ye method kaam aayega
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
}
