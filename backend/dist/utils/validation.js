"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = validateEmail;
exports.validatePassword = validatePassword;
exports.validateName = validateName;
exports.validateAddress = validateAddress;
function validateEmail(email) {
    if (!email)
        return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Invalid email format';
    }
    return null;
}
function validatePassword(password) {
    if (!password)
        return 'Password is required';
    if (password.length < 8 || password.length > 16) {
        return 'Password must be between 8 and 16 characters';
    }
    const hasUppercase = /[A-Z]/.test(password);
    if (!hasUppercase) {
        return 'Password must include at least one uppercase letter';
    }
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasSpecial) {
        return 'Password must include at least one special character';
    }
    return null;
}
function validateName(name) {
    if (!name)
        return 'Name is required';
    if (name.length < 20 || name.length > 60) {
        return 'Name must be between 20 and 60 characters';
    }
    return null;
}
function validateAddress(address) {
    if (!address)
        return 'Address is required';
    if (address.length > 400) {
        return 'Address cannot exceed 400 characters';
    }
    return null;
}
