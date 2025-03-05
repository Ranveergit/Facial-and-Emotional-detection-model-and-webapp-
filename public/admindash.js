async function toggleApproval(button) {
    const userId = button.getAttribute('data-user-id');
    const isApproved = button.classList.contains('approved');

    try {
        const response = await fetch(`/admin/approve/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ approved: !isApproved })
        });

        if (!response.ok) {
            throw new Error('Failed to update approval status');
        }

        // Toggle approval status visually
        button.classList.toggle('approved');
        button.classList.toggle('denied');
        const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        row.remove();

    } catch (error) {
        console.error('Error toggling approval:', error.message);
    }
}

async function denyUser(userId) {
    try {
        const response = await fetch(`/admin/deny/${userId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to deny and delete user');
        }

        // Blur the row
        const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        row.classList.add('blurred');
    } catch (error) {
        console.error('Error denying and deleting user:', error.message);
    }
}

// document.addEventListener('DOMContentLoaded', function() {
//     const viewApprovedUsersBtn = document.getElementById('viewApprovedUsersBtn');

//     viewApprovedUsersBtn.addEventListener('click', function() {
//         // Navigate the user to the approved_users.html page
//         window.location.href = '/approveduser.ejs';
//     });
// });