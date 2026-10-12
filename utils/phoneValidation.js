/** Indian 10-digit mobile: starts with 6–9, not all the same digit. */
export function isValidIndianMobile(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return false;
  if (!/^[6-9]\d{9}$/.test(digits)) return false;
  if (/^(\d)\1{9}$/.test(digits)) return false;
  return true;
}

export function indianMobileValidationMessage(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return 'Enter a valid 10-digit mobile number';
  if (/^(\d)\1{9}$/.test(digits)) return 'Invalid number';
  if (!/^[6-9]/.test(digits)) return 'Invalid number';
  if (!/^[6-9]\d{9}$/.test(digits)) return 'Invalid number';
  return null;
}
