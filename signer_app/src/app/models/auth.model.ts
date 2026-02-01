// Request Models
export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    fullname: string;
    username: string;
    password: string;
}

// Response Models
export interface RegisterResponse {
    userId: string;
}

export interface ApiResponse<T> {
    status: string;
    message: string;
    data: T;
    timestamp: string;
}

// User Model
export interface User {
    username: string;
    fullname?: string;
}
