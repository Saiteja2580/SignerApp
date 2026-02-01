package com.signer.signer_api.utils;

import org.apache.catalina.filters.AddDefaultCharsetFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandlerUtil {
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseWrapperUtil<Void>> handleGeneralException(Exception ex){
        return new ResponseEntity<>(
                ResponseWrapperUtil.error(ex.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ResponseWrapperUtil<Void>> handleUsernameNotFoundException(UsernameNotFoundException ex){
        return new ResponseEntity<>(
                ResponseWrapperUtil.error(ex.getMessage()), HttpStatus.NOT_FOUND
        );
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<ResponseWrapperUtil<Void>> handleNullPointer(NullPointerException ex){
        return new ResponseEntity<>(
                ResponseWrapperUtil.error(ex.getMessage()), HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ResponseWrapperUtil<String>> handleBadCredentials(BadCredentialsException ex) {
        // Return a 401 Unauthorized with your custom wrapper
        return new ResponseEntity<>(
                ResponseWrapperUtil.error("Invalid username or password"),
                HttpStatus.UNAUTHORIZED
        );
    }


}
