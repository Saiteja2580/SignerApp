package com.signer.signer_api.utils;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponseWrapperUtil<T> {
    private String status;
    private String message;
    private T data;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    public static <T> ResponseWrapperUtil<T> success(T data, String message) {
        return ResponseWrapperUtil.<T>builder().status("SUCCESS").message(message).data(data).timestamp(LocalDateTime.now()).build();
    }

    public static <T> ResponseWrapperUtil<T> error(String message){
        return ResponseWrapperUtil.<T>builder().status("ERROR").message(message).data(null).timestamp(LocalDateTime.now()).build();
    }
}
