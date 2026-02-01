package com.signer.signer_api.utils;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.BasicConstraints;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.KeyUsage;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.*;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/**
 * Manages the Root Certificate Authority (CA) for the signing system.
 * The Root CA is used to sign temporary user certificates.
 */
@Slf4j
@Component
@Getter
public class RootCAManager {

    @Value("${app.certificates.root.path:./certs/root_ca.p12}")
    private String rootCAPath;

    @Value("${app.certificates.root.password:rootCAPassword}")
    private String rootCAPassword;

    @Value("${app.certificates.root.alias:RootCA}")
    private String rootCAAlias;

    @Value("${app.certificates.root.validity-years:10}")
    private int rootValidityYears;

    private PrivateKey rootPrivateKey;
    private X509Certificate rootCertificate;

    @PostConstruct
    public void init() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        try {
            Path caPath = Paths.get(rootCAPath);
            if (Files.exists(caPath)) {
                loadRootCA();
                log.info("Root CA loaded from: {}", rootCAPath);
            } else {
                generateRootCA();
                log.info("Root CA generated and saved to: {}", rootCAPath);
            }
        } catch (Exception e) {
            log.error("Failed to initialize Root CA", e);
            throw new RuntimeException("Root CA initialization failed", e);
        }
    }

    private void loadRootCA() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (FileInputStream fis = new FileInputStream(rootCAPath)) {
            keyStore.load(fis, rootCAPassword.toCharArray());
        }
        rootPrivateKey = (PrivateKey) keyStore.getKey(rootCAAlias, rootCAPassword.toCharArray());
        rootCertificate = (X509Certificate) keyStore.getCertificate(rootCAAlias);
    }

    private void generateRootCA() throws Exception {
        // Ensure directory exists
        Path caDir = Paths.get(rootCAPath).getParent();
        if (caDir != null && !Files.exists(caDir)) {
            Files.createDirectories(caDir);
        }

        // Generate key pair
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(4096); // Stronger key for root CA
        KeyPair keyPair = keyGen.generateKeyPair();

        // Build certificate
        X500Name issuer = new X500Name("CN=Signer App Root CA, O=Signer App, C=IN");
        BigInteger serial = BigInteger.valueOf(System.currentTimeMillis());
        Date notBefore = new Date();
        Date notAfter = Date.from(Instant.now().plus(rootValidityYears * 365L, ChronoUnit.DAYS));

        X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                issuer,
                serial,
                notBefore,
                notAfter,
                issuer, // Self-signed: subject = issuer
                keyPair.getPublic()
        );

        // Add CA extensions
        certBuilder.addExtension(Extension.basicConstraints, true, new BasicConstraints(true));
        certBuilder.addExtension(Extension.keyUsage, true, 
            new KeyUsage(KeyUsage.keyCertSign | KeyUsage.cRLSign | KeyUsage.digitalSignature));

        ContentSigner signer = new JcaContentSignerBuilder("SHA256WithRSA")
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .build(keyPair.getPrivate());

        rootCertificate = new JcaX509CertificateConverter()
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .getCertificate(certBuilder.build(signer));

        rootPrivateKey = keyPair.getPrivate();

        // Save to keystore
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        keyStore.load(null, null);
        keyStore.setKeyEntry(rootCAAlias, rootPrivateKey, rootCAPassword.toCharArray(),
                new java.security.cert.Certificate[]{rootCertificate});

        try (FileOutputStream fos = new FileOutputStream(rootCAPath)) {
            keyStore.store(fos, rootCAPassword.toCharArray());
        }
    }

    /**
     * Signs a user certificate with the Root CA.
     *
     * @param userPublicKey The user's public key
     * @param fullName      The user's full name for the certificate subject
     * @param validityHours How long the certificate should be valid
     * @return The signed user certificate
     */
    public X509Certificate signUserCertificate(PublicKey userPublicKey, String fullName, int validityHours) throws Exception {
        X500Name issuer = new X500Name("CN=Signer App Root CA, O=Signer App, C=IN");
        X500Name subject = new X500Name("CN=" + fullName + ", O=Signer App, C=IN");
        BigInteger serial = BigInteger.valueOf(System.currentTimeMillis());
        Date notBefore = new Date();
        Date notAfter = Date.from(Instant.now().plus(validityHours, ChronoUnit.HOURS));

        X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                issuer,
                serial,
                notBefore,
                notAfter,
                subject,
                userPublicKey
        );

        // User certificate is not a CA
        certBuilder.addExtension(Extension.basicConstraints, true, new BasicConstraints(false));
        certBuilder.addExtension(Extension.keyUsage, true,
                new KeyUsage(KeyUsage.digitalSignature | KeyUsage.nonRepudiation));

        ContentSigner signer = new JcaContentSignerBuilder("SHA256WithRSA")
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .build(rootPrivateKey);

        return new JcaX509CertificateConverter()
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .getCertificate(certBuilder.build(signer));
    }
}
