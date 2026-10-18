const BASE = 'https://evegah.cloud/api';

let activeUserMobile = '';

export function setUserMobile(mobile) {
  activeUserMobile = last10(mobile);
}

export function getUserMobile() {
  return activeUserMobile;
}

export function last10(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function buildHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  const mobile = activeUserMobile;
  if (mobile && !headers['x-user-mobile']) {
    headers['x-user-mobile'] = mobile;
  }
  return headers;
}

export async function apiGet(path, headers = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method: 'GET',
    headers: buildHeaders(headers),
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

export async function apiPost(path, body, headers = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: buildHeaders(headers),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

export function shortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '');
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function rupee(amount, credit) {
  const value = Math.abs(Number(amount) || 0).toFixed(2);
  if (credit == null) return `₹${value}`;
  return `${credit ? '+' : '−'}₹${value}`;
}

// -------------------------------------------------------------
// 1. Aadhaar Offline e-KYC (Sandbox.co.in Live)
// -------------------------------------------------------------
export async function requestAadhaarOtp({ aadhaar_number, mobile, consent = 'y', reason = 'For KYC' }) {
  return apiPost('/kyc/aadhaar/otp', { aadhaar_number, mobile: last10(mobile), consent, reason });
}

export async function verifyAadhaarOtp({ reference_id, otp, mobile }) {
  return apiPost('/kyc/aadhaar/verify', { reference_id, otp, mobile: last10(mobile) });
}

export async function getKycStatus(mobile) {
  const mob = last10(mobile);
  return apiGet(`/kyc/status?mobile=${mob}`);
}

export async function getKycHealth() {
  return apiGet('/kyc/health');
}

export async function uploadRenterDocuments(docs) {
  return apiPost('/renters/documents', docs);
}

export async function getRenterDocuments(mobile) {
  const mob = last10(mobile);
  return apiGet(mob ? `/renters/documents?mobile=${mob}` : '/renters/documents');
}

// -------------------------------------------------------------
// 2. Zones, Stations & Live Vehicle Availability
// -------------------------------------------------------------
export async function getZoneDetailWithBikeCountList() {
  return apiGet('/v1/getzoneDetailWithBikeCountList');
}

export async function getZones() {
  return apiGet('/zones');
}

export async function getAvailableVehicles(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/reservations/available-vehicles${query ? `?${query}` : ''}`);
}

export async function getVehiclesByZone(zoneName = '', status = 'Available') {
  const params = [];
  if (zoneName && zoneName.toLowerCase() !== 'all zones') {
    params.push(`zone=${encodeURIComponent(zoneName)}`);
  }
  if (status) {
    params.push(`status=${encodeURIComponent(status)}`);
  }
  const qs = params.length > 0 ? `?${params.join('&')}` : '';
  return apiGet(`/vehicles${qs}`);
}

export async function getVehicleModels() {
  return apiGet('/vehicles/models');
}

// -------------------------------------------------------------
// 3. QR Code Scanning & IoT Bike Unlock
// -------------------------------------------------------------
export async function decryptQr({ qrString, lockNumber }) {
  return apiPost('/qrDecrypted', { qrString, lockNumber });
}

export async function assignIotDevice(data) {
  return apiPost('/iot/devices/assign', data);
}

export async function getVehicleTelemetry(code) {
  return apiGet(`/vehicles/${encodeURIComponent(code)}`);
}

// -------------------------------------------------------------
// 4. Bookings, Rides & Rental Management
// -------------------------------------------------------------
export async function startNewRide(data) {
  return apiPost('/rides/new', data);
}

export async function getActiveRide(identifier) {
  const mobile = last10(identifier);
  try {
    const res = await apiGet(`/reservations/active-ride${mobile ? `?mobile=${mobile}` : ''}`);
    if (res?.has_active_ride || res?.data || res?.ride) return res;
  } catch {}
  return apiGet(`/rides/active/${encodeURIComponent(identifier)}`);
}

export async function returnRide(data) {
  return apiPost('/rides/return', data);
}

export async function extendRide(data) {
  return apiPost('/rides/extend', data);
}

export async function initiatePayuExtend(data) {
  return apiPost('/rides/extend/initiate-payu', data);
}

export async function exchangeVehicle(data) {
  return apiPost('/rides/exchange', data);
}

export async function getRideHistory(identifier) {
  return apiGet(`/rides/history/${encodeURIComponent(identifier)}`);
}

export async function createReservation(data) {
  return apiPost('/reservations', data);
}

export async function cancelReservation(id) {
  return apiPost(`/reservations/${encodeURIComponent(id)}/cancel`, {});
}

// -------------------------------------------------------------
// 5. Rider Profile & Account
// -------------------------------------------------------------
export async function checkMobile(mobile) {
  return apiGet(`/renters/check-mobile/${last10(mobile)}`);
}

export async function getRenterProfile(mobile) {
  const mob = last10(mobile);
  return apiGet(mob ? `/renters/profile?mobile=${mob}` : '/renters/profile');
}

export async function updateRenterProfile(data) {
  return apiPost('/renters', data);
}

// -------------------------------------------------------------
// 6. Rider Wallet & Transactions
// -------------------------------------------------------------
export async function getWalletBalance(mobile) {
  return apiGet(`/wallet/balance?mobile=${last10(mobile)}`);
}

export async function walletAddMoney(data) {
  return apiPost('/wallet/add-money', data);
}

export async function walletWithdraw(data) {
  return apiPost('/wallet/withdraw', data);
}

export async function getWalletTransactions(mobile) {
  return apiGet(`/wallet/transactions?mobile=${last10(mobile)}`);
}

// -------------------------------------------------------------
// 7. Online Payment Gateways (PhonePe, PayU & ICICI UPI)
// -------------------------------------------------------------
export async function getPaymentGatewaysConfig() {
  try {
    return await apiGet('/payments/gateways');
  } catch {
    return apiGet('/payments/gateways/config');
  }
}

export async function createPhonePeQr(data) {
  return apiPost('/phonepe/qr', data);
}

export async function initiatePhonePe(data) {
  return apiPost('/phonepe/initiate', data);
}

export async function getPhonePeStatus(txId) {
  return apiGet(`/phonepe/status/${encodeURIComponent(txId)}`);
}

export async function createPayuQr(data) {
  return apiPost('/payments/payu/qr', data);
}

export async function initiatePayu(data) {
  return apiPost('/payments/payu/initiate', data);
}

export async function getPayuStatus(txnid) {
  return apiGet(`/payments/payu/status/${encodeURIComponent(txnid)}`);
}

export async function initiateIciciUpi(data) {
  return apiPost('/payments/icici/initiate', data);
}

export async function getIciciStatus(txId) {
  return apiGet(`/payments/icici/status/${encodeURIComponent(txId)}`);
}

export async function getPaymentHistory() {
  return apiGet('/payments/history');
}

export async function sendLoginSmsOtp(mobile, otp) {
  const clean = last10(mobile);
  const url = `https://2factor.in/API/V1/7d84d134-26fe-11ed-9c12-0200cd936042/SMS/${clean}/${otp}/eVegah+SMS`;
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    return { Status: 'Error', message: err.message };
  }
}

// -------------------------------------------------------------
// 8. Coupons & Promo Discounts
// -------------------------------------------------------------
export async function getCoupons() {
  return apiGet('/coupons');
}

// -------------------------------------------------------------
// 9. Referral Program & Rewards
// -------------------------------------------------------------
export async function getReferral(mobile, name = 'Rider') {
  return apiGet(`/referral?mobile=${encodeURIComponent(last10(mobile))}&name=${encodeURIComponent(name)}`);
}

export async function redeemReferral(data) {
  return apiPost('/referral/redeem', data);
}

// -------------------------------------------------------------
// 10. Banners & Announcements
// -------------------------------------------------------------
export async function getBanners() {
  return apiGet('/banners');
}

export async function getAnnouncements() {
  return apiGet('/announcements');
}

// -------------------------------------------------------------
// 11. Push Notifications
// -------------------------------------------------------------
export async function registerPushToken(token, mobile) {
  return apiPost('/notifications/register-token', { token, mobile: last10(mobile) });
}

export async function unregisterPushToken(mobile) {
  return apiPost('/notifications/unregister-token', { mobile: last10(mobile) });
}

export async function getNotifications(mobile) {
  return apiGet(`/notifications?mobile=${last10(mobile)}`);
}

export async function markNotificationsRead(ids, mobile) {
  return apiPost('/notifications/mark-read', { ids, mobile: last10(mobile) });
}

// -------------------------------------------------------------
// 12. System Health & Diagnostics
// -------------------------------------------------------------
export async function checkHealth() {
  return apiGet('/health');
}

// -------------------------------------------------------------
// 13. System Settings, Knowledge & Green Mobility
// -------------------------------------------------------------
export async function getSystemSettings() {
  return apiGet('/settings');
}

export async function getKnowledge() {
  return apiGet('/knowledge');
}

export async function getStatsCo2() {
  return apiGet('/stats/co2');
}

export async function getReservations(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/reservations${query ? `?${query}` : ''}`);
}

