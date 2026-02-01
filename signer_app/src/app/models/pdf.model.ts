// PDF Document Interface
export interface PdfDocument {
    file: File | null;
    totalPages: number;
    currentPage: number;
    zoom: number;
}

// Signature Box Configuration
export interface SignatureConfig {
    borderColor: string;
    borderWidth: number;
    borderStyle: 'solid' | 'dashed';
    backgroundColor: string;
    fontSize: number;
    fontColor: string;
    showDetails: boolean;
}

// Signature Box Position and Size
export interface SignatureBox {
    x: number;              // Pixel position from left
    y: number;              // Pixel position from top
    width: number;          // Width in pixels
    height: number;         // Height in pixels
    page: number;           // Page number
    config: SignatureConfig;
}

// Normalized coordinates for backend (0-1 scale)
export interface NormalizedSignature {
    x: number;              // 0-1 range
    y: number;              // 0-1 range
    width: number;          // 0-1 range
    height: number;         // 0-1 range
    page: number;
    borderColor: string;
    fontSize: number;
}

// Signature Request for backend
export interface SignatureRequest {
    pdfFile: string;        // Base64 encoded
    signature: NormalizedSignature;
    certificateId: string;
}

// PDF Dimensions
export interface PdfDimensions {
    width: number;
    height: number;
}
