package com.signer.signer_api.utils;


import com.signer.signer_api.models.dto.certificate.CertificateRecord;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.OperatorCreationException;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.beans.factory.annotation.Value;

import java.io.FileOutputStream;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.Security;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Slf4j
public class GenerateCertificateUtil {

    @Value("${app.certificates.storage.path}")
    private  String storageDir;

    public  String getResolvedPath(String username){
        return Paths.get(storageDir).resolve(username + "_cert.p12").toAbsolutePath().toString();
    }

    public CertificateRecord generateUserCertificate(String username, String fullName, String password) throws Exception{
        log.info("Generate Certificate Method Called .....");
        Path path = Paths.get(storageDir);
        log.info("This is Files path "+String.valueOf(path));
        if (!Files.exists(path)) {
            Files.createDirectories(path);
        }

        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048);
        KeyPair pair = keyGen.generateKeyPair();

        X509Certificate cert = generateSelfSignedCertificate(pair,fullName);

        String fullPath = getResolvedPath(username);

        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        keyStore.load(null, null);
        log.info(password);
        keyStore.setKeyEntry(username, pair.getPrivate(), fullName.toCharArray(), new java.security.cert.Certificate[]{cert});

        try (FileOutputStream fos = new FileOutputStream(fullPath)) {
            keyStore.store(fos, fullName.toCharArray());
        }

        return new CertificateRecord(fullPath.toString(),username);
    }

    private X509Certificate generateSelfSignedCertificate(KeyPair pair, String fullName) throws OperatorCreationException, CertificateException {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME)==null){
            Security.addProvider(new BouncyCastleProvider());
        }

        X500Name dnName = new X500Name("CN="+fullName);
        BigInteger serial = BigInteger.valueOf(System.currentTimeMillis());
        Date startDate = new Date(); // Now
        Date endDate = Date.from(Instant.now().plus(365, ChronoUnit.DAYS));
        X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                dnName,
                serial,
                startDate,
                endDate,
                dnName,
                pair.getPublic()
        );
        ContentSigner signer = new JcaContentSignerBuilder("SHA256WithRSA").build(pair.getPrivate());
        return new JcaX509CertificateConverter()
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .getCertificate(certBuilder.build(signer));
    }

}
