package com.wct.rcdo.exception;

import com.wct.rcdo.dto.ArchiveConflictResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class ArchiveConflictAdvice {

    @ExceptionHandler(ArchiveConflictException.class)
    public ResponseEntity<ArchiveConflictResponse> handleArchiveConflict(ArchiveConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getConflictResponse());
    }
}
