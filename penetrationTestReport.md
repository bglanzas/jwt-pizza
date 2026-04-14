# Penetration Test Report

**Peer 1:** Sophia Bushman (sophiebushman1) — pizza.sophiebyu.click  
**Peer 2:** Boston — pizza.pizzaboston.click  
**Date:** April 2026

---

## Self Attack — Boston

### Attack 1: JWT Tampering / Privilege Escalation Attempt

| Field | Details |
| --- | --- |
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Identification and Authentication Failures  |
| Severity | 1 |
| Description | An authenticated JWT was captured in Burp Suite, the payload was decoded, the `role` claim was changed from `diner` to `admin`, and the payload was re-encoded while preserving the original signature. The tampered token was then resent to determine whether the server validates the JWT signature before authorizing the request. |
| Images | The tampered token was sent in the `Authorization` header. The server responded with `HTTP/2 401 Unauthorized` and the body `{"message":"unauthorized"}`. |
| Corrections | No correction required because the server correctly rejected the tampered token. |

### Attack 2: SQL Injection Attempt

| Field | Details |
| --- | --- |
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Injection  |
| Severity | 1 |
| Description | The login request to `/api/auth` was captured in Burp Suite, and SQL injection payloads such as `"' OR 1=1 --"`, `"' OR 'a'='a"`, and malformed input like `"'"` were inserted into the email and password fields. The objective was to determine whether authentication could be bypassed or whether the backend would reveal database errors when processing unsafe input. |
| Images | Modified requests containing SQL injection payloads were submitted. The server consistently returned unauthorized responses and did not expose SQL errors or any other unexpected behavior. |
| Corrections | No correction required. The application appears to be protected against SQL injection, likely through parameterized queries or other safe backend input handling. |

### Attack 3: Unauthorized Menu Price Modification

| Item | Result |
|---|---|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Broken Access Control  |
| Severity | 3 |
| Description| A menu update request was captured using Burp Suite, targeting an endpoint responsible for modifying pizza menu data such as `/api/order/menu`. The request payload was altered to change the price of an existing pizza item. This request was sent without proper authorization checks or role validation. The server accepted the modified request and updated the pizza price, indicating that the backend trusts client-provided data without enforcing proper access control. This demonstrates that a non-privileged user can manipulate sensitive business data. |
| Images | A modified request was sent via Burp Repeater with an updated pizza price in the request body. The server responded with a success status (`HTTP 200 OK`), and the price change was reflected in subsequent requests, confirming the unauthorized modification. |
| Corrections | Add strict authorization checks to ensure only users with appropriate roles such as admin or franchise owner can modify menu data. Validate user roles from the JWT on the backend and do not trust client-provided fields. Implement middleware to enforce role-based access control on all sensitive endpoints. |

### Attack 4: Business Logic Abuse 

| Item | Result |
|---|---|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Broken Access Control / Security Misconfiguration  |
| Severity | 4 |
| Description | A menu update request was intercepted using Burp Suite and modified to alter the price of pizza items. The request was replayed multiple times with manipulated values, including extremely low, negative, and arbitrarily high prices. The server accepted all modifications without validating the input or enforcing restrictions on who could perform the action. This demonstrates a business logic vulnerability where critical application behavior, specifically pricing, can be manipulated directly by a client. |
| Images | Modified requests were sent through Burp Repeater with altered price values such as negative values and extremely large values. The server returned successful responses (`HTTP 200 OK`), and the changes persisted in the application, confirming that unauthorized manipulation was possible. |
| Corrections | Enforce strict server-side validation for all pricing fields, ensuring values are numeric, non-negative, and within a reasonable range. Implement role-based access control to restrict menu modification to authorized users only. Additionally, add logging and monitoring for unusual pricing changes to detect abuse. |

### Attack 5 Brute Force Login / Credential Stuffing

| Item | Result |
|---|---|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Identification and Authentication Failures |
| Severity | 3 |
| Description | The login endpoint (`/api/auth`) was tested for brute force vulnerabilities using Burp Suite Intruder. A series of automated login attempts were performed using a list of common passwords such as `1234`, `password`, `admin`, and `qwerty` against a known email address. The goal was to determine whether the application enforces rate limiting, account lockout, or other protections against repeated failed login attempts. |
| Images | Burp Suite Intruder results show multiple login attempts sent in rapid succession with different password payloads. The server consistently returned responses, primarily `404` status codes, for each request without blocking, delaying, or throttling the attempts. No rate limiting or lockout mechanism was observed during the attack. |
| Corrections | Implement rate limiting on the login endpoint to restrict the number of authentication attempts within a given time period. Introduce account lockout mechanisms after repeated failed login attempts. Consider adding CAPTCHA or multi-factor authentication (MFA) to mitigate automated brute force attacks. Additionally, monitor and log repeated failed login attempts for anomaly detection. |

## Boston Attacks Sophia Bushman

### Attack 1: Brute Force Login (No Rate Limiting)

| Item | Result |
|------|--------|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Broken Authentication  |
| Severity | 3 |
| Description | The login endpoint does not implement any rate limiting or brute-force protection. Using Burp Suite Intruder, multiple login attempts were sent with different password payloads such as `123`, `password`, and `pizza`. The server processed all requests without blocking, delaying, or locking the account. This allows an attacker to perform unlimited password guessing attempts, significantly increasing the risk of account compromise. Additionally, the endpoint consistently returned a `404` status code for failed login attempts instead of a more appropriate `401 Unauthorized`, indicating improper error handling. |
| Images | Burp Intruder results showing repeated login attempts with varying payloads and consistent `404` responses, with no rate limiting or lockout observed |
| Corrections | Implement rate limiting on the login endpoint, such as limiting requests per IP address or account. Add account lockout after a defined number of failed attempts. Introduce exponential backoff or delays between attempts. Return proper HTTP status codes such as `401` or `403` for failed authentication. Consider using CAPTCHA after repeated failures. |

# Attack 2: Default Credentials Login

| Item | Result |
|------|--------|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Broken Authentication (OWASP A07) |
| Severity | 3 |
| Description | The application allows login using publicly known default credentials. The email "a@jwt.com" and password "admin" were found on a public class website and successfully authenticated into the system. This indicates that default or test credentials were not removed or disabled in the production environment. Any attacker with access to these publicly available credentials could gain unauthorized access to the system without needing to perform any attack. |
| Images | POST /api/auth with {"email":"a@jwt.com","password":"admin"} → successful authentication response with valid JWT token |
| Corrections | Remove all default or test credentials from the production environment. Enforce strong password policies and require unique credentials for all users. Consider disabling known test accounts and implementing monitoring for suspicious logins using common credential pairs. |

# Attack 3: Price Manipulation in Order Request

| Item | Result |
|------|--------|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Broken Access Control / Insecure Direct Object Manipulation  |
| Severity | 4 |
| Description | The application allows users to modify sensitive order fields such as price, description, and menuId before submitting an order. By intercepting the request in Burp Suite and modifying the payload (e.g., setting "price": -10), the server accepted the manipulated request and processed the order. This indicates that the backend does not validate or enforce trusted pricing data, instead relying on client-supplied values. An attacker could exploit this to purchase items at arbitrary or negative prices, leading to financial loss and data integrity issues. |
| Images | POST /api/order with modified payload: {"menuId":4,"description":"yes","price":-10,"storeId":"2","franchiseId":1,"id":307} → request accepted and processed |

# Attack 4: JWT Token Expiration Validation

| Item | Result |
|------|--------|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Authentication Control Validation |
| Severity | 1 |
| Description | The application was tested to determine whether JWT tokens include a proper expiration mechanism. After authenticating, the JWT token was decoded and analyzed. The token contained both an "iat" (issued at) and "exp" (expiration) claim. The expiration value was set to a reasonable time window, indicating that tokens are not valid indefinitely. This prevents long-term unauthorized access if a token is compromised. |
| Images | Decoded JWT payload showing "iat": 1776203588 and "exp": 1776289988 |
| Corrections | No correction needed. The application correctly implements token expiration. |

# Attack 5: SQL Injection Validation

| Item | Result |
|------|--------|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Injection (OWASP A03) |
| Severity | 1 |
| Description | The application was tested for SQL injection vulnerabilities by submitting malicious input in authentication fields and other user-controlled inputs (e.g., "' OR '1'='1", "'; DROP TABLE users; --"). These payloads were sent through the login endpoint and other API requests using Burp Suite. The server did not execute any unintended queries and instead returned normal error responses, indicating that input is properly handled and likely parameterized. No evidence of SQL injection was observed. |
| Images | POST /api/auth with payload {"email":"' OR '1'='1","password":"' OR '1'='1"} → authentication failed; no unauthorized access granted |


## Combined Summary of Learnings

Key takeaways from this penetration test:

Boston:
- I learned that strong security depends on server-side enforcement. Even when the client appears to behave correctly, the backend must independently validate roles, prices, and other sensitive fields rather than trusting user-supplied data.
- I also learned that authentication protections need multiple layers. Proper JWT validation is important, but rate limiting, removal of default credentials, and correct failure handling are just as necessary to reduce the risk of account compromise.
