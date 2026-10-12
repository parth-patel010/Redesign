# Pending pages

Compared with the existing rider app. Screens that were folded into a page already built are listed at the bottom and are not counted as pending.

**16 pages still to design.**

The next one in the current flow is **End ride**.

## Done


| #   | Page              | In this app                                             |
| --- | ----------------- | ------------------------------------------------------- |
| 1   | Login             | `screens/LoginScreen.js`                                |
| 2   | OTP               | `screens/OtpScreen.js`                                  |
| 3   | Home              | `screens/HomeScreen.js`                                 |
| 4   | Nearby map        | `screens/LocationScreen.js`                             |
| 5   | My Rides          | `screens/MyRidesScreen.js` (empty state only)           |
| 6   | Scan              | `screens/ScanScreen.js`                                 |
| 7   | Wallet            | `screens/WalletScreen.js`                               |
| 8   | Profile           | `screens/ProfileScreen.js` (hub only, rows do not open) |
| 9   | Vehicle details   | `screens/VehicleDetailsScreen.js`                       |
| 10  | Rent your EV      | `screens/RentScreen.js`                                 |
| 11  | Checkout          | `screens/PayScreen.js`                                  |
| 12  | Booking confirmed | `screens/BookingConfirmedScreen.js`                     |
| 13  | Live ride         | `screens/RideScreen.js`                                 |


## Next in this flow


| #   | Page     | Notes                                                                                    |
| --- | -------- | ---------------------------------------------------------------------------------------- |
| 1   | End ride | After **End ride** on the live ride. In the old app this is a feedback sheet, then home. |


## Still to build

### Rides and unlock


| #   | Page             | Opens from                                                     |
| --- | ---------------- | -------------------------------------------------------------- |
| 2   | Ride detail      | A booking on My Rides. My Rides is only the empty state today. |
| 3   | Unlocking        | After a successful scan                                        |
| 4   | Bluetooth unlock | Alternate unlock path                                          |


### Profile rows

These labels are on Profile and do not open yet.


| #6 | Page          |
| --- | ------------- |
| 5   | Edit profile  |
|     | KYC documents |
| 7   | Refer & earn  |
| 8   | Offers        |
| 9   | Safety & Help |
| 10  | Preferences   |
| 11  | About Evegah  |


KYC camera and KYC preview belong inside KYC, not as separate pages. FAQ belongs inside Safety & Help.

### Elsewhere in the old app


| #   | Page               | Opens from               |
| --- | ------------------ | ------------------------ |
| 12  | Notifications      | Home bell                |
| 13  | Transaction detail | A row in Wallet          |
| 14  | Insights           | Old app insights         |
| 15  | Security           | Old app security         |
| 16  | BMS live status    | Side menu in the old app |


## Not pending

These old screens are already covered by a page above.


| Old screen                               | Covered by                                                   |
| ---------------------------------------- | ------------------------------------------------------------ |
| Select location, zone map, map discovery | Nearby map and Rent                                          |
| Select date and time                     | Rent                                                         |
| Vehicle list                             | Home and Vehicle details. The scooter is chosen before Rent. |
| Payment and offers                       | Checkout                                                     |
| Booking confirmed                        | Booking confirmed                                            |
| Ride started                             | Live ride                                                    |
| Second profile and second help files     | Profile and Safety & Help                                    |


Create profile (name and photo after OTP) is not in this app. Login goes OTP, then Home. Add it only if signup should ask for a name.