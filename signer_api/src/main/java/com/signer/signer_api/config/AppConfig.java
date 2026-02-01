package com.signer.signer_api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.signer.signer_api.filters.JwtAuthFilter;
import com.signer.signer_api.utils.GenerateCertificateUtil;
import com.signer.signer_api.utils.JWTUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    @Bean
    public BCryptPasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public GenerateCertificateUtil generateCertificateUtil(){
        return new GenerateCertificateUtil();
    }

    @Bean
    public JWTUtils jwtUtils(){
        return new JWTUtils();
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter(){
        return new JwtAuthFilter();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config){
        return config.getAuthenticationManager();
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

}
