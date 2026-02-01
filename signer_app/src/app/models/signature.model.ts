export interface SignatureData {
  // Position data
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;

  // Appearance data
  borderColor: string;
  fontSize: number;
  fontStyle: string;
  fontColor: string;

  // Signing data
  role: string;
  reason: string;
  location: string;

  // PDF data
  base64Pdf?: string;
  fileName?: string;
  totalPages?: number;

  // Custom Signature data
  signatureImage?: string;
  signatureText?: string;
  signatureFont?: string;
}

export interface SignatureBox {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

export interface SignatureRequest {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  borderColor: string;
  fontSize: number;
  fontStyle: string;
  fontColor: string;
  role: string;
  reason: string;
  location: string;
  base64Pdf: string;
  // Optional custom signature image (base64 PNG) - for drawn/uploaded signatures
  signatureImage?: string;
  // Optional typed signature data
  signatureText?: string;
  signatureFont?: string;
}
