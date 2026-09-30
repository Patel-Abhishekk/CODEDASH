async function seed() {
  try {
    const loginRes = await fetch('http://127.0.0.1:5000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'Test@123456' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData.message);

    if (loginData.user && loginData.user.id) {
      const taskRes = await fetch('http://127.0.0.1:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Build MongoDB Integration", 
          description: "Test task for verifying cloud database storage works", 
          bounty: 200, 
          deadlineHours: 24, 
          userId: loginData.user.id
        })
      });
      const taskData = await taskRes.json();
      console.log('Task:', taskData.message);
    }
  } catch (err) {
    console.error(err);
  }
}
seed();
