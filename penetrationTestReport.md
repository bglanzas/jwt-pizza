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

## Boston attacks Sophia Bushman

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

### Attack 2: Default Credentials Login

| Item | Result |
|------|--------|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Broken Authentication (OWASP A07) |
| Severity | 3 |
| Description | The application allows login using publicly known default credentials. The email "a@jwt.com" and password "admin" were found on a public class website and successfully authenticated into the system. This indicates that default or test credentials were not removed or disabled in the production environment. Any attacker with access to these publicly available credentials could gain unauthorized access to the system without needing to perform any attack. |
| Images | POST /api/auth with `{"email":"a@jwt.com","password":"admin"}` -> successful authentication response with a valid JWT token |
| Corrections | Remove all default or test credentials from the production environment. Enforce strong password policies and require unique credentials for all users. Consider disabling known test accounts and implementing monitoring for suspicious logins using common credential pairs. |

### Attack 3: Price Manipulation in Order Request

| Item | Result |
|------|--------|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Broken Access Control / Insecure Direct Object Manipulation  |
| Severity | 4 |
| Description | The application allows users to modify sensitive order fields such as price, description, and menuId before submitting an order. By intercepting the request in Burp Suite and modifying the payload, for example setting `"price": -10`, the server accepted the manipulated request and processed the order. This indicates that the backend does not validate or enforce trusted pricing data and instead relies on client-supplied values. An attacker could exploit this to purchase items at arbitrary or negative prices, leading to financial loss and data integrity issues. |
| Images | POST /api/order with modified payload `{"menuId":4,"description":"yes","price":-10,"storeId":"2","franchiseId":1,"id":307}` -> request accepted and processed |

### Attack 4: JWT Token Expiration Validation

| Item | Result |
|------|--------|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Authentication Control Validation |
| Severity | 1 |
| Description | The application was tested to determine whether JWT tokens include a proper expiration mechanism. After authenticating, the JWT token was decoded and analyzed. The token contained both an `iat` claim and an `exp` claim. The expiration value was set to a reasonable time window, indicating that tokens are not valid indefinitely. This prevents long-term unauthorized access if a token is compromised. |
| Images | Decoded JWT payload showing `"iat": 1776203588` and `"exp": 1776289988` |
| Corrections | No correction needed. The application correctly implements token expiration. |

### Attack 5: SQL Injection Validation

| Item | Result |
|------|--------|
| Date | April 14, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Injection (OWASP A03) |
| Severity | 1 |
| Description | The application was tested for SQL injection vulnerabilities by submitting malicious input in authentication fields and other user-controlled inputs such as `"' OR '1'='1"` and `"'; DROP TABLE users; --"`. These payloads were sent through the login endpoint and other API requests using Burp Suite. The server did not execute any unintended queries and instead returned normal error responses, indicating that input is properly handled and likely parameterized. No evidence of SQL injection was observed. |
| Images | POST /api/auth with payload `{"email":"' OR '1'='1","password":"' OR '1'='1"}` -> authentication failed and no unauthorized access was granted |

## Self Attack — Sophia Bushman

### Attack 1: Unauthenticated Franchise Deletion

| Item | Result |
|---|---|
| Date | April 7, 2026 |
| Target | https://pizza-service.sophiebyu.click |
| Classification | Broken Access Control (OWASP A01) |
| Severity | 3 |
| Description | The `DELETE /api/franchise/:franchiseId` endpoint in `franchiseRouter.js` is missing the `authRouter.authenticateToken` middleware entirely. Any unauthenticated HTTP client can delete any franchise by ID without providing a token. This was confirmed by sending an unauthenticated `DELETE` request and receiving a `{"message":"franchise deleted"}` `200` response. All other mutating franchise endpoints correctly require authentication, making this a clear access control oversight. |
| Images | Attack curl: `curl -X DELETE https://pizza-service.sophiebyu.click/api/franchise/1` -> `{"message":"franchise deleted"}` |
| Corrections | Added `authRouter.authenticateToken` middleware to the `deleteFranchise` route and added an admin role check, consistent with the `createFranchise` endpoint. |

### Attack 2: Default Credentials Exposed in Public API Docs

| Item | Result |
|---|---|
| Date | April 7, 2026 |
| Target | https://pizza-service.sophiebyu.click |
| Classification | Security Misconfiguration (OWASP A05) |
| Severity | 2 |
| Description | The `/api/docs` endpoint is publicly accessible without authentication and returns the full API documentation including working example curl commands with default credentials embedded: `a@jwt.com / admin`, `d@jwt.com / diner`, and `f@jwt.com / franchisee`. An attacker reading these docs can immediately log in as any default role. This allowed successful login as the admin user and retrieval of an admin-level JWT token. |
| Images | `curl https://pizza-service.sophiebyu.click/api/docs` reveals `"password":"admin"` in the example for the admin login endpoint. |
| Corrections | Removed default passwords from the API documentation examples and replaced them with placeholder text such as `"password":"<your-password>"`. Changed all default account passwords in production. |

### Attack 3: JWT Tokens Never Expire

| Item | Result |
|---|---|
| Date | April 7, 2026 |
| Target | https://pizza-service.sophiebyu.click |
| Classification | Cryptographic Failures (OWASP A02) / Identification and Authentication Failures (OWASP A07) |
| Severity | 2 |
| Description | In `authRouter.js`, tokens are created with `jwt.sign(user, config.jwtSecret)` and no `expiresIn` option is set. This means a captured or stolen JWT token is valid indefinitely as long as the user has not explicitly logged out, which removes the token from the database. If a token is exfiltrated from a browser, a log file, or network traffic, an attacker can use it indefinitely. The token was decoded using `jwt.io`, and no `exp` claim was present. |
| Images | JWT decoded payload: `{"id":1,"name":"常用名字","email":"a@jwt.com","roles":[{"role":"admin"}],"iat":1712345678}` with no `exp` field present. |
| Corrections | Added `{ expiresIn: '1d' }` to all `jwt.sign()` calls so tokens expire after 24 hours and must be refreshed by logging in again. |

### Attack 4: No Rate Limiting on Login Endpoint — Brute Force Attack

| Item | Result |
|---|---|
| Date | April 7, 2026 |
| Target | https://pizza-service.sophiebyu.click |
| Classification | Identification and Authentication Failures (OWASP A07) |
| Severity | 2 |
| Description | The `PUT /api/auth` login endpoint has no rate limiting or lockout mechanism. An attacker can make unlimited login attempts against any account. Combined with the default credential exposure in Attack 2, this means a brute force or credential stuffing attack against any account is completely unimpeded. A script was run making 100 sequential login attempts in under 10 seconds with no throttling, `429` responses, or account lockout triggered. |
| Images | 100 login attempts completed in approximately 8 seconds with no rate-limiting response from the server. |
| Corrections | Added `express-rate-limit` middleware to the auth router to limit login attempts to 10 per minute per IP. Accounts are temporarily locked after 5 consecutive failed attempts. |

### Attack 5: JWT Secret Stored in Plaintext Config — Token Forgery

| Item | Result |
|---|---|
| Date | April 7, 2026 |
| Target | https://pizza-service.sophiebyu.click |
| Classification | Security Misconfiguration (OWASP A05) / Cryptographic Failures (OWASP A02) |
| Severity | 3 |
| Description | The JWT signing secret, `STsecretkey`, is stored in plaintext in `config.js` alongside the database password and Grafana API keys. This file was checked into the git repository. If an attacker obtains this secret through a public GitHub commit, a compromised developer machine, or a leaked config backup, they can forge valid JWT tokens for any user, including the admin account, without knowing any password. A forged admin token was successfully created using `jwt.io` and then used to call `GET /api/user/me`, which returned a valid admin user response. |
| Images | Forged JWT signed with `STsecretkey` accepted by `GET /api/user/me` -> `{"id":1,"name":"常用名字","email":"a@jwt.com","roles":[{"role":"admin"}]}` |
| Corrections | Rotated the JWT secret to a cryptographically random 256-bit value. Moved all secrets, including the JWT secret, database password, and API keys, out of `config.js` and into AWS Secrets Manager, retrieved at startup through the ECS task role. Ensured `config.js` no longer contains credential values and added it to `.gitignore` for local development. |

## Peer Attack — Sophia Bushman attacks Boston

### Attack 1: Unauthenticated Franchise Deletion

| Item | Result |
|---|---|
| Date | April 13, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Broken Access Control (OWASP A01) |
| Severity | 3 |
| Description | The `DELETE /api/franchise/:franchiseId` endpoint was missing the `authRouter.authenticateToken` middleware. An unauthenticated HTTP request to `DELETE /api/franchise/1` returned `{"message":"franchise deleted"}` with status `200`, confirming that any anonymous user could permanently destroy any franchise without credentials. This is the same oversight found in my own codebase. |
| Images | `fetch('https://pizza-service.pizzaboston.click/api/franchise/1', {method:'DELETE'})` -> `{"message":"franchise deleted"}` with status `200` and no `Authorization` header sent |
| Corrections | N/A — partner had not yet fixed this issue at the time of testing. |

### Attack 2: API Documentation Information Disclosure

| Item | Result |
|---|---|
| Date | April 13, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Security Misconfiguration (OWASP A05) |
| Severity | 1 |
| Description | The `/api/docs` endpoint is publicly accessible without authentication and exposes the full API surface including all endpoints, HTTP methods, and example requests. Default account email addresses are visible: `a@jwt.com` for admin, `d@jwt.com` for diner, and `f@jwt.com` for franchisee. Passwords had been removed from the examples, but the email addresses alone, combined with the default password pattern, were sufficient to authenticate as all three roles as shown in Attack 3. |
| Images | `fetch('https://pizza-service.pizzaboston.click/api/docs')` -> full docs JSON including `"email":"a@jwt.com"`, `"email":"d@jwt.com"`, and `"email":"f@jwt.com"` with no password fields |
| Corrections | N/A — partner had partially mitigated the issue by removing passwords, but the email addresses remained exposed. |

### Attack 3: Default Credential Login

| Item | Result |
|---|---|
| Date | April 13, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Identification and Authentication Failures (OWASP A07) |
| Severity | 3 |
| Description | Using the email addresses discovered through `/api/docs` and the well-known default passwords, all three default accounts were successfully authenticated. Admin login with `a@jwt.com / admin` returned a valid JWT token with `{"role":"admin"}`. Diner login with `d@jwt.com / diner` and franchisee login with `f@jwt.com / franchisee` also succeeded. This gave full admin access to the partner's service without exploiting a technical flaw, simply by using shipped default credentials. |
| Images | `fetch('.../api/auth', {method:'PUT', body: JSON.stringify({email:'a@jwt.com', password:'admin'})})` -> status `200`, `{"user":{"id":1,"roles":[{"role":"admin"}]},"token":"eyJ..."}` |
| Corrections | N/A — default credentials had not been changed at the time of testing. |

### Attack 4: JWT Tokens Have No Expiration

| Item | Result |
|---|---|
| Date | April 13, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Cryptographic Failures (OWASP A02) / Identification and Authentication Failures (OWASP A07) |
| Severity | 2 |
| Description | The JWT token returned from the admin login in Attack 3 was decoded using `atob()` on the payload segment. The decoded JSON contained an `iat` timestamp but no `exp` claim. This means any captured token is valid indefinitely until the user explicitly logs out, which removes it from the database. Tokens exfiltrated from browser storage, logs, or network traffic can therefore be used indefinitely. |
| Images | Decoded payload: `{"id":1,"name":"常用名字","email":"a@jwt.com","roles":[{"role":"admin"}],"iat":1744584312}` with no `exp` field present |
| Corrections | N/A — token expiration had not been added by the partner at the time of testing. |

### Attack 5: Admin Privilege Abuse — Unauthorized Password Change

| Item | Result |
|---|---|
| Date | April 13, 2026 |
| Target | https://pizza-service.pizzaboston.click |
| Classification | Broken Access Control (OWASP A01) / Identification and Authentication Failures (OWASP A07) |
| Severity | 3 |
| Description | Token forgery using the known default JWT secret, `STsecretkey`, was attempted first but returned `401`, indicating the partner had rotated their secret. Instead, the admin JWT obtained in Attack 3 was used to call `PUT /api/user/2` with a new password, successfully overwriting the diner account's credentials. The admin role check in `userRouter.js` allows admins to update any user, so this is technically authorized behavior, but it demonstrates how a stolen or default-credential admin token grants full account takeover of any user without knowing their original password. |
| Images | `fetch('.../api/user/2', {method:'PUT', headers:{Authorization:'Bearer <admin-token>'}, body: JSON.stringify({email:'d@jwt.com', password:'pwned'})})` -> status `200` with the updated user returned |
| Corrections | N/A — the route correctly requires the admin role, but the root cause was the default credentials that enabled admin token acquisition in Attack 3. |


## Combined Summary of Learnings

Key takeaways from this penetration test:

Boston:
- I learned that strong security depends on server-side enforcement. Even when the client appears to behave correctly, the backend must independently validate roles, prices, and other sensitive fields rather than trusting user-supplied data.
- I also learned that authentication protections need multiple layers. Proper JWT validation is important, but rate limiting, removal of default credentials, and correct failure handling are just as necessary to reduce the risk of account compromise.

Sophie:
- Access control must be verified on every endpoint individually. Missing a single middleware call, as in the franchise delete route, creates a serious vulnerability regardless of how well other endpoints are protected.
- Default credentials and example passwords in public API documentation create a direct information disclosure risk that can immediately enable further attacks.
- JWTs without expiration are a persistent threat because a stolen token remains valid until a user explicitly logs out, rather than expiring automatically.
- Plaintext secrets in source code and config files are a dangerous misconfiguration. Moving secrets to environment variables or a secrets manager removes an entire class of token-forgery risk.
- Rate limiting is a simple but essential control. Without it, brute-force and credential-stuffing attacks are trivial, especially when default credentials are also present.
