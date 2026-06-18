package com.example.salonManagement.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    // Yeh bean UserService ko BCrypt encoder provide karega
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Temporary security rules testing ke liye
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // API testing ke liye CSRF disable karna zaroori hai
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll() // Abhi ke liye sab open rakha hai taaki test kar sakein
                );

        return http.build();
    }
}
