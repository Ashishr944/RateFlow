export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
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

export function validateName(name: string): string | null {
  if (!name) return 'Name is required';
  if (name.length < 20 || name.length > 60) {
    return 'Name must be between 20 and 60 characters';
  }
  return null;
}

export function validateAddress(address: string): string | null {
  if (!address) return 'Address is required';
  if (address.length > 400) {
    return 'Address cannot exceed 400 characters';
  }
  return null;
}
