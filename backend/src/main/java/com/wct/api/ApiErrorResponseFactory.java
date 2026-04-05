package com.wct.api;

import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class ApiErrorResponseFactory {

    public Map<String, Object> create(HttpStatusCode status,
                                      String error,
                                      String message,
                                      String path) {
        return create(status, error, message, path, Map.of());
    }

    public Map<String, Object> create(HttpStatusCode status,
                                      String error,
                                      String message,
                                      String path,
                                      Map<String, ?> extras) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", OffsetDateTime.now());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        body.put("path", path);
        body.putAll(extras);
        return body;
    }
}
