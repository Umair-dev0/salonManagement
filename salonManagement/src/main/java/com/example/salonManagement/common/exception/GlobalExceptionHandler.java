package com.example.salonManagement.common.exception;

import com.example.salonManagement.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<?> illegalArgument(IllegalArgumentException e) {
        return ApiResponse.error(e.getMessage());
    }

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<?> notFound(NotFoundException e) {
        return ApiResponse.error(e.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<?> conflict(ConflictException e) {
        return ApiResponse.error(e.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<?> badCredentials(BadCredentialsException e) {
        return ApiResponse.error("Invalid email or password");
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<?> accessDenied(AccessDeniedException e) {
        return ApiResponse.error("You do not have permission to access this resource");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<?> validationError(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return new ApiResponse<>(false, null, "Validation failed", errors);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<?> genericError(Exception e) {
        // Logging is handled by Spring, return safe clean message to avoid leaking stack traces
        e.printStackTrace();
        return ApiResponse.error("An unexpected error occurred");

    }
    @ExceptionHandler(org.springframework.security.authentication.DisabledException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<?> disabledUser(org.springframework.security.authentication.DisabledException e) {
        return ApiResponse.error("Your account has been disabled or deleted. Please contact the administrator.");
    }
//    // Spring Security ke login errors (galat password/email) ko handle karne ke liye
//    @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
//    public org.springframework.http.ResponseEntity<ApiResponse<Void>> handleBadCredentialsException(org.springframework.security.authentication.BadCredentialsException ex) {
//        ApiResponse<Void> response = ApiResponse.error("Invalid email or password");
//        return new org.springframework.http.ResponseEntity<>(response, org.springframework.http.HttpStatus.UNAUTHORIZED);
//    }
}

