# Campus Food Buddy — Demonstration Testing Checklist

Use two separate accounts (Student A and Student B). Record **Pass / Fail** and a screenshot for
each test when preparing the FYP demonstration.

| ID | Test | Steps | Expected result |
|---|---|---|---|
| T01 | Register | Register Student A with a valid email and password. | Account is created and a profile is available. |
| T02 | Invalid login feedback | Attempt login with an incorrect password. | Clear “Incorrect email or password” feedback appears. |
| T03 | Password reset | Enter a registered email and tap **Forgot password?**. | Firebase reset email confirmation appears. |
| T04 | Profile guidance | Use a new account with no dining choices. | Matches shows **Complete Profile** and opens Edit Profile. |
| T05 | Matching | Complete compatible profiles for both students. | The other student appears with an explainable percentage score. |
| T06 | Request | Student A sends Student B a request. | Student B sees it in Requests and Updates shows a badge. |
| T07 | Accept + chat | Student B accepts the request. | Both students see one chat; Buddy History lists the connection. |
| T08 | Live message + unread state | Send a message from Student A to Student B while Student B is outside the chat. | Message and chat preview update; Student B sees a Chats badge and unread dot, which clear after opening the chat. |
| T09 | Block | Block a student from their profile. | They disappear from Matches and cannot receive a new request. |
| T10 | Report | Submit a report with a reason, then try reporting the same student again. | The first report is created and unavailable to normal users; the duplicate is rejected. |
| T11 | Admin review | Sign in as the assigned admin and open Profile → Admin: Review Reports. | Report is visible and can be marked Resolved. |
| T12 | Security check | Sign in as a normal user and try to access admin-related data through the app. | Admin dashboard is hidden and report records are not readable. |

## Before demonstrating

1. Confirm the latest `firestore.rules` is published in Firebase Console.
2. Confirm your own UID is in `adminUsers/{uid}` only if demonstrating the admin page.
3. Sign in with two different accounts in separate browser profiles or devices.
4. Keep the app open at `http://localhost:8082` and prepare the Firebase Console only as a backup.
