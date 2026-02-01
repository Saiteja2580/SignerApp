package com.signer.signer_api.services;

import com.signer.signer_api.models.dto.certificate.CertificateSession;
import com.signer.signer_api.utils.RootCAManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ConcurrentHashMap;


@Slf4j
@Service
@RequiredArgsConstructor
public class SessionCertificateService {

    private final RootCAManager rootCAManager;

    @Value("${app.certificates.session.validity-hours:24}")
    private int sessionValidityHours;

    // In-memory store: username -> CertificateSession
    private final ConcurrentHashMap<String, CertificateSession> sessions = new ConcurrentHashMap<>();


    public CertificateSession createSession(String username, String fullName) {
        try {
            // Generate a new key pair for this session
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
            keyGen.initialize(2048);
            KeyPair keyPair = keyGen.generateKeyPair();

            // Get Root CA to sign the user certificate
            X509Certificate userCert = rootCAManager.signUserCertificate(
                    keyPair.getPublic(),
                    fullName,
                    sessionValidityHours
            );

            // Build certificate chain: [User Cert, Root CA Cert]
            X509Certificate[] chain = new X509Certificate[]{
                    userCert,
                    rootCAManager.getRootCertificate()
            };

            Instant now = Instant.now();
            CertificateSession session = new CertificateSession(
                    keyPair.getPrivate(),
                    userCert,
                    chain,
                    now,
                    now.plus(sessionValidityHours, ChronoUnit.HOURS)
            );

            sessions.put(username, session);
            log.info("Created certificate session for user: {}", username);
            return session;

        } catch (Exception e) {
            log.error("Failed to create certificate session for user: {}", username, e);
            throw new RuntimeException("Certificate session creation failed", e);
        }
    }


    public CertificateSession getSession(String username) {
        CertificateSession session = sessions.get(username);
        if (session == null) {
            return null;
        }
        if (session.isExpired()) {
            sessions.remove(username);
            log.info("Session expired for user: {}", username);
            return null;
        }
        return session;
    }


    public boolean hasValidSession(String username) {
        return getSession(username) != null;
    }


    public void invalidateSession(String username) {
        CertificateSession removed = sessions.remove(username);
        if (removed != null) {
            log.info("Invalidated certificate session for user: {}", username);
        }
    }


    @Scheduled(fixedRate = 60000)
    public void cleanupExpiredSessions() {
        int removed = 0;
        for (String username : sessions.keySet()) {
            CertificateSession session = sessions.get(username);
            if (session != null && session.isExpired()) {
                sessions.remove(username);
                removed++;
            }
        }
        if (removed > 0) {
            log.info("Cleaned up {} expired certificate sessions", removed);
        }
    }


    public int getActiveSessionCount() {
        return sessions.size();
    }
}
