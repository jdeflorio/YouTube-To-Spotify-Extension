document.getElementById('logout').addEventListener('click',
  async function () {
    console.log('loggggingggg outttt');
      await chrome.runtime.sendMessage({ message: 'logout' });
      window.close();
});
