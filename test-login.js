async function testLogin() {
  // First get CSRF token
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  
  const res = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      csrfToken,
      email: "admin@logivox.ai",
      password: "Admin@Logivox1!",
      json: "true"
    }),
  });
  
  const data = await res.json();
  console.log("Login result:", data);
}
testLogin().catch(console.error);
