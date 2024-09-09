function setCookie(name, value, expirationInDays) {
  console.log("Setting cookie", name, value, expirationInDays)
  const d = new Date();
  d.setTime(d.getTime() + (expirationInDays * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/;domain=" + window.location.hostname;
}

function cookieExists(name) {
  return document.cookie.includes(name);
}

function getCookie(name) {
  console.log("Getting cookie", name)
  unsplitted = document.cookie.split(name + "=")[1]
  if (unsplitted == undefined) {
    return ''
  }
  return unsplitted.split(";")[0];
}
