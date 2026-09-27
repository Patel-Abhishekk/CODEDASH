async function testCors(origin, url, description) {
    try {
        console.log(`\n--- Testing ${description} ---`);
        console.log(`Sending request to ${url} with Origin: ${origin}`);
        
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            }),
            headers: {
                'Origin': origin,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log(`✅ Success! Status: ${response.status}`);
            return true;
        } else {
            console.log(`❌ Failed with status ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Network/CORS Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    const localhostUrl = 'http://localhost:5000/api/users/login';
    const networkUrl = 'http://10.69.236.249:5000/api/users/login';
    
    // 1. Test from Localhost
    await testCors('http://localhost:3000', localhostUrl, 'Localhost Access');
    
    // 2. Test from Network
    await testCors('http://10.69.236.249:3000', networkUrl, 'Network Access (Same IP)');
    
    // 3. Test from Unauthorized Network
    await testCors('http://192.168.9.99:4000', networkUrl, 'Unauthorized Origin');
}

runTests();
