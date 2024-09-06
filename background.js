console.log("LOADEI!!!")

window.addEventListener("UserloggedIn", event => {
  console.log("WORKING HARD!!!")
  chrome.cookies.set(
    { url: "https://equipped-concise-owl.ngrok-free.app", name: "UserKey", value: event.detail.jwt }
  );
});

console.log("FINALIZEI O LOAD!!!")
