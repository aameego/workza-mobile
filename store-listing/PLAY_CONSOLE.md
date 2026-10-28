# Workza: Google Play listing kit

Files in this folder:

| File | Play Console field |
|---|---|
| `icon-512.png` | App icon (512×512) |
| `feature-graphic-1024x500.png` | Feature graphic |
| `screenshot-1.png` … `screenshot-7.png` | Phone screenshots (1080×1920) |

Screenshots use a fake demo company ("Sunrise Logistics") on the dev database. They contain no real employee data.

## Before you paste the prompts

1. **Deploy the frontend** so that https://workza.ai/privacy-policy is live. Play checks this URL.
2. **Create a reviewer demo account on production.** Google's reviewers need to sign in. Create an organisation such as "Workza Demo" on workza.ai with one HR user and one employee. Give the demo site a large geofence radius (or turn the geofence off for it) so reviewers outside India can still check in. Fill in the `<<…>>` placeholders in prompt 2 with these details.

---

## Store listing text

**App name** (30 max): `Workza: HR, Attendance & Payroll`

**Short description** (80 max):
`Selfie attendance, leave, payslips and HR approvals for every workforce.`

**Full description:**

```
Workza is the HR and payroll app for teams that work on the ground and in the office. Your employer sets up Workza, and you sign in with your organisation code.

FOR EMPLOYEES
• Check in and out with a selfie, verified against your work site's geofence
• See your attendance, late marks and monthly summary
• Apply for leave or work from home and track your balance
• View and download your payslips
• Submit expense claims and advance requests
• Get HR letters such as offer, joining and experience letters

FOR HR, MANAGERS AND SUPERVISORS
• Live view of who is present today across every site
• Approve leave, regularization and expense requests in a tap
• Manage employees, departments, shifts and week-offs
• Run attendance-linked payroll with PF, ESIC, PT and TDS
• Issue HR letters from ready templates

BUILT FOR BLUE-COLLAR AND WHITE-COLLAR TEAMS
Logistics, warehousing, quick-commerce, staffing and offices use Workza to replace paper registers, WhatsApp rosters and spreadsheets.

Workza needs an account from your employer. Camera and location are used only when you mark attendance.

Privacy policy: https://workza.ai/privacy-policy
```

**App category:** Business · **Email:** sales@karpragati.com · **Website:** https://workza.ai

---

## Prompts for the Claude Chrome extension

Paste these one at a time while Play Console is open on the Workza app.

### 1. Privacy policy

```
In Google Play Console for the app "Workza" (package com.aameego.workza), open Dashboard > "Set privacy policy" (App content > Privacy policy). Enter https://workza.ai/privacy-policy as the privacy policy URL and save. Stop and show me before clicking Save if anything else on the page needs a decision.
```

### 2. App access (sign-in details)

```
In Play Console for Workza, open App content > App access. Choose "All or some functionality in my app is restricted". Add one instruction set named "Demo HR account" with:
- Username: <<demo HR email or phone>>
- Password: <<demo password>>
- Any other information: "Organisation code: <<ORG CODE>>. Enter it in the Organisation Code field on the login screen. Accounts are created by the employer; there is no public sign-up. The camera and location permissions are used only for the attendance check-in on the Attendance screen. The demo site has a large geofence so check-in works from anywhere."
Tick the box saying no other info is needed to access the app, if it is shown. Show me the filled form before saving.
```

### 3. Ads

```
In Play Console for Workza, open App content > Ads. Select "No, my app does not contain ads" and save.
```

### 4. Content rating

```
In Play Console for Workza, open App content > Content rating and start a new questionnaire. Email: sales@karpragati.com. Category: "All other app types" (utility / productivity / business).
Answers:
- Violence, sexuality, language, controlled substances, gambling, horror/fear: No to all.
- Does the app allow users to interact or exchange content with other users (chat, sharing images or audio)? No.
- Does the app share the user's current physical location with other users? Yes (employers and managers see the location where an employee checked in).
- Does the app allow users to purchase digital goods? No.
- Is this a web browser or search engine? No.
- Does the app contain unrestricted internet access? No.
- Is the app a news or educational product? No.
Show me the summary page before you submit the rating.
```

### 5. Target audience and content

```
In Play Console for Workza, open App content > Target audience and content. Select only the "18 and over" age group. For "Could your store listing unintentionally appeal to children?" choose No. Save and show me the result.
```

### 6. Data safety

```
In Play Console for Workza, open App content > Data safety and fill the form like this:

Data collection and security
- Does your app collect or share any of the required user data types? Yes
- Is all user data encrypted in transit? Yes
- Account creation method: "Username and password" plus "Other" if offered. Accounts are created by the employer, not in the app.
- Add the delete-account URL: https://workza.ai/privacy-policy#delete-account
- Do you provide a way for users to request that some or all of their data is deleted? Yes

Data types: mark each one as Collected, NOT Shared, NOT processed ephemerally, Required (not optional), purposes "App functionality" and "Account management":
- Location: Precise location
- Personal info: Name, Email address, Phone number, Address, User IDs, Other info (date of birth, gender, PAN/Aadhaar)
- Financial info: Other financial info (salary, bank account)
- Photos and videos: Photos (attendance selfies)
- Files and docs
For Photos and Location, purpose is "App functionality" only.
Do NOT select: Health, Messages, Audio, Contacts, Calendar, App activity, Web browsing, App info and performance, Device or other IDs.
Show me the preview page before you submit.
```

### 7. Government apps, financial features, health

```
In Play Console for Workza, open App content and complete these declarations:
- Government apps: No, this app is not developed by or on behalf of a government.
- Financial features: select "My app doesn't provide any financial features". (Workza shows payslips and records salary advance requests that the employer handles itself; it does not lend, move money or process payments.)
- Health apps: select that the app has no health features.
- Advertising ID (if asked): No, the app does not use advertising ID.
- News app (if asked): No.
Save each one and show me any page that asks for something not listed here.
```

### 8. Store listing

```
In Play Console for Workza, open Grow users > Store presence > Main store listing. Fill in:
- App name: Workza: HR, Attendance & Payroll
- Short description: Selfie attendance, leave, payslips and HR approvals for every workforce.
- Full description: <paste the full description from PLAY_CONSOLE.md>
- App icon: upload icon-512.png
- Feature graphic: upload feature-graphic-1024x500.png
- Phone screenshots: upload screenshot-1.png to screenshot-7.png in order
(all files are in AameegoGig-Mobile/store-listing; I'll pick them in the file dialog if you can't)
Then open Store settings: App category = Business, contact email = sales@karpragati.com, website = https://workza.ai.
Save as draft and show me before sending anything for review.
```

### 9. Release

```
In Play Console for Workza, go to Publishing overview / Dashboard and list every task that is still incomplete or has a warning. Don't send anything for review; just tell me what is left.
```

> If this is a **personal** developer account created after November 2023, Google requires a closed test with at least 12 testers for 14 days before you can publish to production. Organisation accounts skip this step.
