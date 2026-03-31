package com.wct.rcdo.exception;

import com.wct.rcdo.dto.ArchiveConflictResponse;

public class ArchiveConflictException extends RuntimeException {

    private final ArchiveConflictResponse conflictResponse;

    public ArchiveConflictException(ArchiveConflictResponse conflictResponse) {
        super(conflictResponse.message());
        this.conflictResponse = conflictResponse;
    }

    public ArchiveConflictResponse getConflictResponse() {
        return conflictResponse;
    }
}
