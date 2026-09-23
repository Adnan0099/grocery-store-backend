localStorage.setItem('adminToken', data.token);
localStorage.setItem('adminUser', JSON.stringify(data.user));

window.location.href = '/dashboard';