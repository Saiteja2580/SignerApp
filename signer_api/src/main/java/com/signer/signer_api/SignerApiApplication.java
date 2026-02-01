package com.signer.signer_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SignerApiApplication {

    public static void main(String[] args) {
        // Register Bouncy Castle Provider globally at startup
        java.security.Security.addProvider(new org.bouncycastle.jce.provider.BouncyCastleProvider());
        SpringApplication.run(SignerApiApplication.class, args);
    }

}
