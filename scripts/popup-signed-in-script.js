chrome.tabs.query({active: true, lastFocusedWindow: true}, async tabs => {
  const url = tabs[0].url;

  if(url.indexOf("youtube.com/watch?v=") === -1){
    window.location.href = "../popup-invalid-link.html";
  }

  let mostRecentURL = '';

  await chrome.runtime.sendMessage({ message: 'getMostRecentURL' }, function (response) {
    mostRecentURL = response.mostRecentURL;
  });


  

  await chrome.runtime.sendMessage({ message: 'setMostRecentURL', mostRecentURL: url });

  if (mostRecentURL === url){
    setHTML()
    return;
  }

  await chrome.runtime.sendMessage({ message: 'getIsUserSignedIn' }, function (response) {
     if(!response.isUserSignedIn){
       window.location.href = "popup.html";
     }
      return;
  });

  await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`)
  .then((res) => res.json())
  .then(async (data) => {
    
    const ytTitle = data.title;

    await chrome.runtime.sendMessage({ message: 'getToken', data: data }, async function (response) {

      if (response.message === 'success') {

        await fetch(`https://api.spotify.com/v1/search?q=${ytTitle}&type=track`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${response.ACCESS_TOKEN}` 
          }

        })
        .then((res) => res.json())
        .then(async (data) => {
          if(data?.error){
            window.location.href = "popup.html";
          }
          await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${data.tracks.items[0].id}`,
          {
            headers: {
             'Accept': 'application/json',
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${response.ACCESS_TOKEN}` 
           }
          }).then((res) => res.json())
          .then(async (savedData) => {
            if(data?.error){
              window.location.href = "popup.html";
            }
            await chrome.runtime.sendMessage({ message: 'setIsSaved', isSaved: savedData[0] });
            await chrome.runtime.sendMessage({ message: 'sendSongData', data: data.tracks.items[0]}, function (response) {}); 
            setHTML();
          });
        });
      }
    });
  });
});

document.getElementById('logout').addEventListener('click',
  async function () {
      await chrome.runtime.sendMessage({ message: 'logout' });
      window.close();
});

document.getElementById('save-song').addEventListener('click',
  async function () {
    document.getElementById('save-song').classList.toggle('selected');
    document.getElementById('save-song').classList.toggle('notSelected');
    let isSaved = true;
    await chrome.runtime.sendMessage({ message: 'getIsSaved' }, function(response){
      isSaved = response.isSaved;
    });
    await chrome.runtime.sendMessage({ message: 'saveSong', });
    await chrome.runtime.sendMessage({ message: 'setIsSaved', isSaved: !isSaved });

});

async function setHTML() {
  await chrome.runtime.sendMessage({ message: 'getSongData' }, async function (response) {
    if (response?.message === 'sign-in-required'){
      window.location.href="../popup.html";
      return;
    }
    document.getElementById("title").innerHTML = response.songData.title;
    document.getElementById("title").classList.remove("loading")
    document.getElementById("album-cover").src = response.songData.cover;
    document.getElementById("cover-container").classList.remove("loading");
    document.getElementById("artist").innerHTML = response.songData.artist;
    document.getElementById("artist").classList.remove("loading")
    document.getElementById("link").href = response.songData.link;

    await chrome.runtime.sendMessage({ message: 'getIsSaved' }, function(response){
      isSaved = response.isSaved;
      if(isSaved){
        document.getElementById('save-song').classList.toggle('selected');
        document.getElementById('save-song').classList.toggle('notSelected');
      }
    });

  });
}
