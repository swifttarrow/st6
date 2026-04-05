package com.wct.api;

import com.wct.plan.InvalidPlanStatusException;
import com.wct.plan.service.ArchivedOutcomeException;
import com.wct.plan.service.IncompleteReconciliationException;
import com.wct.plan.service.InvalidTransitionException;
import com.wct.rcdo.exception.ArchiveConflictException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    private final ApiErrorResponseFactory apiErrorResponseFactory;

    public ApiExceptionHandler(ApiErrorResponseFactory apiErrorResponseFactory) {
        this.apiErrorResponseFactory = apiErrorResponseFactory;
    }

    @ExceptionHandler(ArchivedOutcomeException.class)
    public ResponseEntity<Map<String, Object>> handleArchivedOutcome(ArchivedOutcomeException ex,
                                                                     HttpServletRequest request) {
        return response(
                HttpStatus.CONFLICT,
                "ARCHIVED_OUTCOME_REFERENCES",
                ex.getMessage(),
                request,
                Map.of("commitmentIds", ex.getCommitmentIds())
        );
    }

    @ExceptionHandler(IncompleteReconciliationException.class)
    public ResponseEntity<Map<String, Object>> handleIncompleteReconciliation(IncompleteReconciliationException ex,
                                                                              HttpServletRequest request) {
        return response(
                HttpStatus.CONFLICT,
                "INCOMPLETE_RECONCILIATION",
                ex.getMessage(),
                request,
                Map.of("unannotatedCommitmentIds", ex.getUnannotatedCommitmentIds())
        );
    }

    @ExceptionHandler(InvalidTransitionException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidTransition(InvalidTransitionException ex,
                                                                       HttpServletRequest request) {
        Map<String, Object> extras = new LinkedHashMap<>();
        if (ex.getFromStatus() != null) {
            extras.put("fromStatus", ex.getFromStatus().name());
        }
        if (ex.getToStatus() != null) {
            extras.put("toStatus", ex.getToStatus().name());
        }
        return response(
                HttpStatus.CONFLICT,
                "INVALID_TRANSITION",
                ex.getMessage(),
                request,
                extras
        );
    }

    @ExceptionHandler(InvalidPlanStatusException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidPlanStatus(InvalidPlanStatusException ex,
                                                                       HttpServletRequest request) {
        return response(
                HttpStatus.BAD_REQUEST,
                "INVALID_STATUS",
                ex.getMessage(),
                request,
                Map.of("targetStatus", ex.getTargetStatus())
        );
    }

    @ExceptionHandler(ArchiveConflictException.class)
    public ResponseEntity<Map<String, Object>> handleArchiveConflict(ArchiveConflictException ex,
                                                                     HttpServletRequest request) {
        return response(
                HttpStatus.CONFLICT,
                "ARCHIVE_CONFLICT",
                ex.getConflictResponse().message(),
                request,
                Map.of(
                        "activeCommitmentCount", ex.getConflictResponse().activeCommitmentCount(),
                        "affectedPlans", ex.getConflictResponse().affectedPlans()
                )
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex,
                                                                HttpServletRequest request) {
        List<Map<String, Object>> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toFieldError)
                .toList();
        return response(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                "Request validation failed",
                request,
                Map.of("fieldErrors", fieldErrors)
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex,
                                                                         HttpServletRequest request) {
        List<Map<String, Object>> fieldErrors = ex.getConstraintViolations()
                .stream()
                .map(violation -> Map.<String, Object>of(
                        "field", violation.getPropertyPath().toString(),
                        "message", violation.getMessage()
                ))
                .toList();
        return response(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                "Request validation failed",
                request,
                Map.of("fieldErrors", fieldErrors)
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex,
                                                                    HttpServletRequest request) {
        HttpStatusCode status = ex.getStatusCode();
        String error = HttpStatus.valueOf(status.value()).name();
        String message = ex.getReason() != null ? ex.getReason() : HttpStatus.valueOf(status.value()).getReasonPhrase();
        return ResponseEntity.status(status)
                .body(apiErrorResponseFactory.create(status, error, message, request.getRequestURI()));
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<Map<String, Object>> handleBadRequest(Exception ex, HttpServletRequest request) {
        return response(
                HttpStatus.BAD_REQUEST,
                "BAD_REQUEST",
                "Malformed request",
                request
        );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex,
                                                                    HttpServletRequest request) {
        return response(
                HttpStatus.UNAUTHORIZED,
                "UNAUTHORIZED",
                ex.getMessage(),
                request
        );
    }

    private Map<String, Object> toFieldError(FieldError fieldError) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("field", fieldError.getField());
        body.put("message", fieldError.getDefaultMessage());
        if (fieldError.getRejectedValue() != null) {
            body.put("rejectedValue", fieldError.getRejectedValue());
        }
        return body;
    }

    private ResponseEntity<Map<String, Object>> response(HttpStatusCode status,
                                                         String error,
                                                         String message,
                                                         HttpServletRequest request) {
        return ResponseEntity.status(status)
                .body(apiErrorResponseFactory.create(status, error, message, request.getRequestURI()));
    }

    private ResponseEntity<Map<String, Object>> response(HttpStatusCode status,
                                                         String error,
                                                         String message,
                                                         HttpServletRequest request,
                                                         Map<String, ?> extras) {
        return ResponseEntity.status(status)
                .body(apiErrorResponseFactory.create(status, error, message, request.getRequestURI(), extras));
    }
}
