package com.signer.signer_api.controllers;

import com.signer.signer_api.models.dto.signature.SignatureRequestDto;
import com.signer.signer_api.services.SignatureService;
import com.signer.signer_api.utils.ResponseWrapperUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Base64;

@RestController
@RequestMapping("/api/signature")
public class SignatureController {

    @Autowired
    private SignatureService signatureService;

    @PostMapping("/sign")
    public ResponseEntity<ResponseWrapperUtil<String>> signPdf(@RequestBody SignatureRequestDto signatureRequestDto) throws Exception {
        byte[] signedPdf = signatureService.processPdf(signatureRequestDto);

        String base64SignedPdf = Base64.getEncoder().encodeToString(signedPdf);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline().filename("signed.pdf").build());
        return new ResponseEntity<>(
                ResponseWrapperUtil.success(base64SignedPdf, "PDF Signed Successfully"),
                HttpStatus.OK
        );
    }

}
