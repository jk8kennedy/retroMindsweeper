const joinButton = document.getElementById('joinButton');

joinButton.addEventListener('click', joinGroup);

async function joinGroup() {
  const email = document.getElementById('email').value;
  const message = document.getElementById('message');

  if (!email) {
    message.innerText = 'Please enter an email address.';
    return;
  }

  message.innerText = 'Submitting...';

  try {
    const response = await fetch('YOUR_GOOGLE_APPS_SCRIPT_URL', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const result = await response.text();

    message.innerText = result;
  }
  catch (err) {
    console.error(err);
    message.innerText = 'Something went wrong.';
  }
}
