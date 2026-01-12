# Learning notes

## JWT Pizza code study and debugging

As part of `Deliverable ⓵ Development deployment: JWT Pizza`, start up the application and debug through the code until you understand how it works. During the learning process fill out the following required pieces of information in order to demonstrate that you have successfully completed the deliverable.

| User activity                                       | Frontend component | Backend endpoints | DatabaseSQL |
|-----------------------------------------------------|--------------------|---------------------------------|
| View homepage                                      |   home.jsx         | None            |        None    |
| Register new user<br/>(t@jwt.com, pw:test)         |  register.jsx    |  [POST] /api auth |     `INSERT INTO user (name, email, password) VALUES (?, ?, ?) <br/>
INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)`        |
| Login new user<br/>(t@jwt.com, pw:test)            |                    |                   |              |
| Orderpizza                                         |                    |                   |              |
| Verifypizza                                        |                    |                   |              |
| View profilepage                                   |                    |                   |              |
| View franchise<br/>(asdiner)                       |                    |                   |              |
|Logout                                              |                    |                   |              |
| View Aboutpage                                     |                    |                   |              |
| View Historypage                                   |                    |                   |              |
| Login as franchisee<br/>(f@jwt.com, pw:franchisee) |                    |                   |              |
| View franchise<br/>(asfranchisee)                  |                    |                   |              |
| Create astore                                      |                    |                   |              |
| Close astore                                       |                    |                   |              |
| Login as admin<br/>(a@jwt.com, pw:admin)           |                    |                   |              |
| View Adminpage                                     |                    |                   |              |
| Create a franchise for t@jwtcom                    |                    |                   |              |
| Close the franchise for t@jwtcom                   |                    |                   |              |
