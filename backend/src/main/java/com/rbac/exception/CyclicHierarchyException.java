package com.rbac.exception;

public class CyclicHierarchyException extends RuntimeException {

    public CyclicHierarchyException(String message) {
        super(message);
    }
}

