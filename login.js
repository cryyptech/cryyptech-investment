import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, set, ref, get, child } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB4MlVTAn20BKgG49nIhaB5dP08ycV6Tdg",
    authDomain: "cryyptechh.firebaseapp.com",
    projectId: "cryyptechh",
    storageBucket: "cryyptechh.appspot.com",
    messagingSenderId: "70442732438",
    appId: "1:70442732438:web:f4cf4c8043c3180421abb7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const dbRef = ref(db);

document.addEventListener('DOMContentLoaded', () => {

  function showMessage(message, divid) {
    let messagediv = document.getElementById(divid);
    if (messagediv) {
      messagediv.style.display = 'block';
      messagediv.innerHTML = message;
      messagediv.style.opacity = 1;
      setTimeout(() => {
        messagediv.style.opacity = 0;
        messagediv.style.display = 'none';
      }, 5000);
    } else {
      console.error(`Element with id ${divid} not found.`);
    }
  }

  function resendverification() {
    document.getElementById('alertconn').style.display = 'flex';
    document.getElementById('resend').disabled = true;
    document.getElementById('resend').style.color = 'grey';
    let timeLeft = 60;
  
    function startCountdown() {
      const countdownInterval = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft--;
          console.log(timeLeft);
          document.getElementById('timer').innerText = timeLeft;
        } else {
          clearInterval(countdownInterval);
          document.getElementById('resend').disabled = false;
          document.getElementById('resend').style.color = '#48d4ff';
        }
      }, 1000);
    };
  
    startCountdown();
  
    document.getElementById('resend').addEventListener('click', () => {
      sendEmailVerification(auth.currentUser);
      document.getElementById('resend').disabled = true;
      timeLeft = 60; // Reset timeLeft
  
      startCountdown(); // Start a new countdown
    });
  }
  
  

  function generateUID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uid = '';
    for (let i = 0; i < 8; i++) {
      uid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uid;
  }

  function checkUID(uid) {
    return get(child(dbRef, `uids/${uid}`)).then((snapshot) => {
      return !snapshot.exists();
    });
  }

  function createUserUID(attempt = 0) {
    if (attempt > 8) {
      console.error("Failed to generate unique UID after 8 attempts.");
      return Promise.reject("UID generation failed.");
    }

    const uid = generateUID();
    return checkUID(uid).then((isUnique) => {
      if (isUnique) {
        return uid;
      } else {
        return createUserUID( attempt + 1);
      }
    }).catch((error) => {
      console.error("Error checking UID uniqueness:", error);
      return Promise.reject(error);
    });
  }

  let forgotpassword = () => {
    const femail = document.getElementById('email').value;
    sendPasswordResetEmail(auth, femail)
    .then(() => {
      showMessage('Password reset link has been sent to your email', 'signinmessage')
    })
    .catch((error) => {
      console.log('error sending link ' + error + error.code);
      console.log('error sending link ' + error + error.message);
      showMessage('error sending link to email', 'signinmessage')
    });
  }

  const signup = document.getElementById('submitsignup');
  const signIn = document.getElementById('submitsignin');
  let forgotpass = document.getElementById('forgot');

  forgotpass.addEventListener('click', forgotpassword)

  signup.addEventListener('click', (event) => {
    event.preventDefault();
    const name = document.getElementById('username').value;
    const remail = document.getElementById('remail').value;
    const rpass = document.getElementById('rpassword').value;

    return createUserUID()
    .then((uid) => {
      return createUserWithEmailAndPassword(auth, remail, rpass)
        .then((userCredential) => {
          const user = userCredential.user;
          sendEmailVerification(auth.currentUser)
          .then(() => {
            showMessage('Email verification link sent', 'signupmessage');
          })
          showMessage('Wallet created successfully', 'signupmessage');

          // Save UID and user info to the database
          return set(ref(db, `uids/${uid}`), true)
          .then(() => set(ref(db, `users/${user.uid}/uid`), uid))
          .then(() => set(ref(db, 'users/' + user.uid), {
              username: name,
              email: remail,
              pass: rpass,
              uuid: uid
          }));

        })
    })
    .then(() => {
      // Save selections to Firebase Realtime Database
      set(ref(db, 'preferences/' + auth.currentUser.uid), {
        country: "val1",
          countryText: "UNITED STATES", 
          currency: "val1",
          currencyText: "USD"
      })
    })
    .then(() => {
      // Save selections to Firebase Realtime Database
      set(ref(db, 'extradata/' + auth.currentUser.uid), {
        mainbal: "0.00",
        btcbal: "0.00", 
        btcval: "0.00",
        bnbbal: "0.00", 
        bnbval: "0.00",
        ethbal: "0.00", 
        ethval: "0.00",
        usdtbal: "0.00", 
        usdtval: "0.00",
        withdrawalfee: "0.00"
      })
    })
    .then(() => {
      const timestamp = new Date().getTime();
      return set(ref(db, 'defaultnotetime/' + auth.currentUser.uid), {
        timestamp: timestamp
      });
    })
    .then(() => {
      window.location.href = 'index.html';
    })
    .catch((error) => {
      const errorcode = error.code;
      if (errorcode === "auth/email-already-in-use") {
        showMessage('Email Address Already Exists !!!', 'signupmessage');
      } else {
        showMessage('Unable to create User', 'signupmessage');
      }
    });
  });

  signIn.addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, pass)
      .then((userCredential) => {
        const user = userCredential.user;
        let emailverified = user.emailVerified;

        if (emailverified) {
          return get(child(dbRef, 'users/' + user.uid))
            .then((snapshot) => {
              if (snapshot.exists()) {
                const userInfo = snapshot.val();
                localStorage.clear();
                localStorage.setItem('userInfo', JSON.stringify(userInfo));

                return get(child(dbRef, 'defaultnotetime/' + user.uid))
                  .then((timesnapshot) => {
                    if (timesnapshot.exists()) {
                      const thyme = timesnapshot.val();
                      localStorage.setItem('defaltime', JSON.stringify(thyme));
                    }
                  });
              } else {
                console.log("No user data available");
              }
            })
            .then(() => {
              // Retrieve saved preferences from Firebase and store them in localStorage
              return get(child(ref(db), 'preferences/' + user.uid))
                .then((snapshot) => {
                  if (snapshot.exists()) {
                    const preferences = snapshot.val();
                    localStorage.setItem('selectedCountry', preferences.country);
                    localStorage.setItem('selectedCountryText', preferences.countryText);
                    localStorage.setItem('selectedCurrency', preferences.currency);
                    localStorage.setItem('selectedCurrencyText', preferences.currencyText); 
                    console.log('Preferences retrieved and stored in localStorage.');
                  } else {
                    console.log("No preferences data available.");
                  }
                });
            })
            .then(() => {
              // Retrieve saved preferences from Firebase and store them in localStorage
              return get(child(ref(db), 'extradata/' + user.uid))
                .then((snapshot) => {
                  if (snapshot.exists()) {
                    const extradata = snapshot.val();
                    localStorage.setItem('mainbal', extradata.mainbal);
                    localStorage.setItem('btcbal', extradata.btcbal);
                    localStorage.setItem('btcval', extradata.btcval);
                    localStorage.setItem('bnbbal', extradata.bnbbal);
                    localStorage.setItem('bnbval', extradata.bnbval);
                    localStorage.setItem('ethbal', extradata.ethbal);
                    localStorage.setItem('ethval', extradata.ethval);
                    localStorage.setItem('usdtbal', extradata.usdtbal);
                    localStorage.setItem('usdtval', extradata.usdtval);
                    localStorage.setItem('withdrawalfee', extradata.withdrawalfee);
                    console.log('Preferences retrieved and stored in localStorage.');
                  } else {
                    console.log("No preferences data available.");
                  }
                });
            })
            .then(() => {
              return get(ref(db, 'notifications/' + user.uid)).then((snapshot) => {
                if (snapshot.exists()) {
                  const notifications = snapshot.val();
                  
                  // Store the notifications in session storage
                  localStorage.setItem('notifications', JSON.stringify(notifications));

                  console.log('Notifications retrieved and stored in session storage:', notifications);
              } else {
                  console.log("No notifications available");
              }
              })
              .catch((error) => {
                console.error("Error retrieving notifications:", error);
              })

            })
            .then(() => {
              return get(child(dbRef, `users/${user.uid}/uuid`)).then((snapshot) => {
                if (snapshot.exists()) {
                  const UserUID = snapshot.val();
                  localStorage.setItem('UserUID', JSON.stringify(UserUID));
                  redirectToHomepage();
                } else {
                  console.error("User UID not found.");
                }
              });
            })
            .catch((error) => {
              console.error("Error during sign-in process:", error);
            });
        } else {
            resendverification()
        }
      })
      .catch((error) => {
        const errorcode = error.code;
        if (errorcode === "auth/wrong-password") {
            showMessage('Incorrect Email or Password', 'signinmessage');
        } if (errorcode === "auth/invalid-credentials") {
          showMessage('Incorrect Email or Password', 'signinmessage');
        } else if (errorcode === "auth/user-not-found") {
            showMessage('Account does not Exist', 'signinmessage');
        } else {
            showMessage('Sign-in Error: invalid credentials', 'signinmessage');
        }
    });
    
  });

  function redirectToHomepage() {
    if (auth.currentUser && localStorage.getItem('userInfo')) {
      window.location.href = 'wallet.html';
    } else {
      console.error('User is not properly authenticated or session data is missing.');
    }
  }
});
